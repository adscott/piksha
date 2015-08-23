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
        resolve(JSON.parse(res.body));
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
        resolve(JSON.parse(result));
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
        resolve();
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
  fetchContent: function () {
    var flickrAlbumsPromise = callFlickr({method: 'flickr.photosets.getList'})
      .then(function (list) { return list.photosets.photoset; });

    var albumsListSavedPromise = flickrAlbumsPromise
      .then(function (photosets) {
        return Promise.all(_.map(photosets, function (photoset) {
          return callFlickr({
            method: 'flickr.photos.getSizes',
            photo_id: photoset.primary
          });
        })).then(function (primaries) {
          return _.map(photosets, function (photoset, index) {
            return {
              url: '/api/albums/' + photoset.id,
              title: photoset.title,
              thumbnail: _.find(primaries[index].sizes.size, function (size) { return size.label === 'Large Square'; }).source
            };
          });
        });
      })
      .then(function (albums) {
        return writeMemcache('albums', albums);
      });

    var albumsSavedPromise = flickrAlbumsPromise
      .then(function (photosets) {
        return Promise.all(_.map(photosets, function (photoset) {
          return callFlickr({
            method: 'flickr.photosets.getPhotos',
            photoset_id: photoset.id
          });
        }));
      })
      .then(function (list) { return _.pluck(list, 'photoset'); })
      .then(function (photosets) {
        return Promise.all(_.map(photosets, function (photoset) {
          return Promise.all(_.map(photoset.photo, function (photo) {
            return callFlickr({
              method: 'flickr.photos.getSizes',
              photo_id: photo.id
            }).then(function (sizes) {
              return {
                title: photo.title,
                full: _.find(sizes.sizes.size, function (size) { return size.label === 'Large 1600'; }).source,
                thumbnail: _.find(sizes.sizes.size, function (size) { return size.label === 'Large Square'; }).source
              };
            });
          })).then(function (photos) {
            return {
              id: photoset.id,
              data: {
                title: photoset.title,
                photos: photos
              }
            };
          });
        }));
      })
      .then(function(albums) {
        return Promise.all(_.map(albums, function (album) {
          return writeMemcache('album-' + album.id, album.data);
        }));
      });

    return Promise.all([albumsListSavedPromise, albumsSavedPromise]);
  }
};
