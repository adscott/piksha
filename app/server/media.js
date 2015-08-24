var Promise = require('promise');
var Memcached = require('memcached');
var _ = require('lodash');
var crypto = require('crypto');
var needle = require('needle');

var config = require('/etc/piksha/config');

var memcached = new Memcached(config.memcached.host + ':' + config.memcached.port);

function generateNonce() {
  return encodeURIComponent(Math.random().toString());
}

function generateTimestamp() {
  var date = new Date();
  var millisec = date.getTime();
  return String(Math.floor(millisec/1000));
}

function sign(data, clientSecret, tokenSecret) {
  var hmac = crypto.createHmac('SHA1', clientSecret + '&' + tokenSecret);
  hmac.update(data);
  return encodeURIComponent(hmac.digest('base64'));
}

function queryString(parameters) {
  var keys = _.keys(parameters);
  var sortedKeys = _.sortBy(keys, function (p) { return p; });
  var pairs = _.map(sortedKeys, function (key) { return encodeURIComponent(key) + '=' + encodeURIComponent(parameters[key]); });
  return pairs.join('&');
}

function callFlickr(opts) {
  var parameters = _.assign({
    oauth_nonce: generateNonce(),
    format: 'json',
    oauth_consumer_key : config.flickr.oauthClientKey,
    oauth_timestamp : generateTimestamp(),
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0',
    oauth_token : config.flickr.oauthToken,
    nojsoncallback: '1'
  }, opts);

  var baseUrl = config.flickr.baseUrl;
  var baseQueryString = queryString(parameters);
  var signable = 'GET&' + encodeURIComponent(baseUrl) + '&' + encodeURIComponent(baseQueryString);
  var oauthSignature = sign(signable, config.flickr.oauthClientSecret, config.flickr.oauthTokenSecret);
  var url = baseUrl + '?' + baseQueryString + '&oauth_signature=' + oauthSignature;

  return new Promise(function (resolve, reject) {
    needle.get(url, function (err, res) {
      if (err) {
        reject();
      } else {
        resolve(res.body);
      }
    });
  });
}

function readMemcache(key) {
  return new Promise(function (resolve, reject) {
    memcached.get(key, function (err, result) {
      if (err) {
        reject();
      } else {
        if (result) {
          resolve(JSON.parse(result));
        } else {
          resolve(false);
        }
      }
    });
  });
}

function writeMemcache(key, value) {
  return new Promise(function (resolve, reject) {
    memcached.set(key, JSON.stringify(value), 0, function (err) {
      if (err) {
        reject();
      } else {
        resolve(value);
      }
    });
  });
}

module.exports = {
  readAlbum: function (albumId) {
    return readMemcache('album-' + albumId);
  },
  readAlbums: function () {
    return readMemcache('albums');
  },
  readPhoto: function (photoId) {
    return readMemcache('photo-' + photoId);
  },
  fetchContent: function () {
    var media = this;

    var getListPromise = callFlickr({method: 'flickr.photosets.getList'});

    var getPhotosPromise = getListPromise
      .then(function (list) { return list.photosets.photoset; })
      .then(function (photosets) {
        return Promise.all(_.map(photosets, function (photoset) {
          return callFlickr({
            method: 'flickr.photosets.getPhotos',
            photoset_id: photoset.id
          }).then(function (photoset) {
            return {
              id: photoset.photoset.id,
              title: photoset.photoset.title,
              primary: photoset.photoset.primary,
              photos: _.map(photoset.photoset.photo, function (photo) { return {id: photo.id, title: photo.title}; })
            };
          });
        }));
      });

    var getSizesPromise = getPhotosPromise
      .then(function (photosets) {
        return Promise.all(_.map(photosets, function (photoset) {
          return Promise.all(_.map(photoset.photos, function (photo) {
            return callFlickr({
              method: 'flickr.photos.getSizes',
              photo_id: photo.id
            })
              .then(function (sizes) { return sizes.sizes.size; })
              .then(function (sizes) {
                return {
                  id: photo.id,
                  full: _.find(sizes, function (size) { return size.label === 'Large 1600'; }).source,
                  thumbnail: _.find(sizes, function (size) { return size.label === 'Large Square'; }).source
                };
              });
          }));
        }));
      })
      .then(function (photos) {
        return _.flattenDeep(photos);
      });

    return getSizesPromise
      .then(function (photos) {
        return Promise.all(_.map(photos, function (photo) {
          return getPhotosPromise
            .then(function (photosets) {
              var idMatch = function (p) { return p.id === photo.id; };
              var photoset = _.find(photosets, function (ps) { return _.any(ps.photos, idMatch); });
              return writeMemcache('photo-' + photo.id, {
                full: photo.full,
                thumbnail: photo.thumbnail,
                title: _.find(photoset.photos, idMatch).title,
                album: '/api/albumss/' + photoset.id
              });
            });
        }));
      })
      .then(function () {
        return getPhotosPromise
          .then(function (photosets) {
            return Promise.all(_.map(photosets, function (photoset) {
              return Promise.all(_.map(photoset.photos, function (photo) {
                return media.readPhoto(photo.id).then(function (p) {
                  return {
                    url: '/api/photos/' + photo.id,
                    title: photo.title,
                    thumbnail: p.thumbnail
                  };
                });
              }))
              .then(function (photos) {
                return writeMemcache('album-' + photoset.id, {
                  photos: photos,
                  title: photoset.title
                });
              });
            }));
          });
      })
      .then(function () {
        return getPhotosPromise
          .then(function (photosets) {
            return Promise.all(_.map(photosets, function (photoset) {
              return media.readPhoto(photoset.primary)
                .then(function (photo) {
                  return {
                    url: '/api/albums/' + photoset.id,
                    title: photoset.title,
                    thumbnail: photo.thumbnail
                  };
                });
            }));
          })
          .then(function (albums) {
            return writeMemcache('albums', albums);
          });
      });
  }
};
