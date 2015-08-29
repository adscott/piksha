var Promise = require('promise');
var Memcached = require('memcached');
var _ = require('lodash');
var crypto = require('crypto');
var needle = require('needle');
var RateLimiter = require('limiter').RateLimiter;


var limiter = new RateLimiter(1, 100);

var config;

try {
  config = require('/etc/piksha/config');
} catch(e) {
  config = {
    flickr: {},
    memcached: {}
  };
}

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

function callFlickr(opts, retryCount) {
  retryCount = retryCount || 0;

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

  return new Promise(function (resolve) {
    limiter.removeTokens(1, function() {
      needle.get(url, function (err, res) {
        if (err) {
          if (retryCount > 5) {
            throw err;
          } else {
            callFlickr(opts, retryCount + 1).then(resolve);
          }
        } else {
          resolve(res.body);
        }
      });
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

function size(photo, suffix) {
  return 'https://farm' +
    photo.farm +
    '.staticflickr.com/' +
    photo.server +
    '/' +
    photo.id + '_' + photo.secret + '_' + suffix + '.jpg';
}

function extractPhotosets(photosets) {
  return _.map(photosets, extractPhotoset);
}

function extractPhotoset(photoset) {
  return {
    id: photoset.photoset.id,
    title: photoset.photoset.title,
    photos: _.map(photoset.photoset.photo, extractPhoto)
  };
}

function extractPhoto(photo) {
  return {
    id: photo.id,
    title: photo.title,
    thumbnail: size(photo, 'q'),
    full: size(photo, 'b'),
    isprimary: !!photo.isprimary
  };
}

function savePhoto(photo, photosetId) {
  return writeMemcache('photo-' + photo.id, {
    title: photo.title,
    thumbnail: photo.thumbnail,
    full: photo.full,
    album: '/api/albums/' + photosetId
  });
}

function saveAlbum(photoset) {
  return writeMemcache('album-' + photoset.id, {
    title: photoset.title,
    photos: photoset.photos.map(function (photo) { return {
      title: photo.title,
      thumbnail: photo.thumbnail,
      url: '/api/photos/' + photo.id
    }; })
  });
}

function saveAlbumsList(photosets) {
  var albums = _.map(photosets, function(photoset) {
    return {
      title: photoset.title,
      thumbnail: _.find(photoset.photos, function (photo) {
        return photo.isprimary;
      }).thumbnail,
      url: '/api/albums/' + photoset.id
    };
  });
  return writeMemcache('albums', _.sortBy(albums, 'title'));
}

function savePhotosets(photosets) {
  var saveAlbumsListPromise = saveAlbumsList(photosets);
  var saveAlbumsPromises = _.map(photosets, saveAlbum);
  var savePhotosPromises = _.flatten(_.map(photosets, function (photoset) {
    return _.map(photoset.photos, function (photo) {
      return savePhoto(photo, photoset.id);
    });
  }));



  return Promise.all([saveAlbumsListPromise]
    .concat(saveAlbumsPromises)
    .concat(savePhotosPromises));
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
    return callFlickr({method: 'flickr.photosets.getList'})
      .then(function (list) { return list.photosets.photoset; })
      .then(function (photosets) {
        return Promise.all(_.map(photosets, function (photoset) {
          return callFlickr({
            method: 'flickr.photosets.getPhotos',
            photoset_id: photoset.id
          });
        }));
      })
      .then(extractPhotosets)
      .then(savePhotosets);
  }
};
