var Promise = require('promise');
var Memcached = require('memcached');
var _ = require('lodash');
var crypto = require('crypto');
var needle = require('needle');
var RateLimiter = require('limiter').RateLimiter;
var winston = require('winston');

var eventReader = require('./event-reader');
var config = require('./config');
var limiter = new RateLimiter(1, 100);
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
  winston.debug('Calling flickr', {opts: opts});
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
          winston.error('Error calling flickr', {error: err});
          if (retryCount > 5) {
            throw err;
          } else {
            callFlickr(opts, retryCount + 1).then(resolve);
          }
        } else {
          winston.debug('Finished calling flickr');
          resolve(res.body);
        }
      });
    });
  });
}

function readMemcache(key) {
  winston.debug('Reading memcache', {key: key});
  return new Promise(function (resolve, reject) {
    memcached.get(key, function (err, result) {
      if (err) {
        winston.error('Error reading memcache', {key: key, error: err});
        reject(err);
      } else {
        winston.debug('Finished reading memcache', {key: key, result: result});
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
    winston.debug('Writing memcache', {key: key, value: value});
    memcached.set(key, JSON.stringify(value), 0, function (err) {
      if (err) {
        winston.error('Error writing memcache', {key: key, value: value, error: err});
        reject(err);
      } else {
        winston.debug('Finished writing memcache', {key: key, value: value});
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

function photoUrl(photoId) {
  return '/api/photos/' + photoId;
}

function decoratePhoto(photo, events) {
  var event = _.find(events, {asset: photo.url});
  return event ? _.assign(photo, {attributes: event.data}) : photo;
}

function savePhoto(photo, photosetId) {
  winston.debug('Saving photo', {photo: photo, photosetId: photosetId});
  var cacheable = {
    title: photo.title,
    thumbnail: photo.thumbnail,
    full: photo.full,
    album: '/api/albums/' + photosetId,
    url: photoUrl(photo.id)
  };
  return Promise.resolve(decoratePhoto(cacheable, [])).then(function (decoratedPhoto) {
    return writeMemcache(decoratedPhoto.url, decoratedPhoto);
  }).then(function () { winston.debug('Finished saving photo', {photo: photo, photosetId: photosetId}); });
}

function saveAlbum(photoset) {
  winston.debug('Saving album', {photoset: photoset});
  return writeMemcache('/api/albums/' + photoset.id, {
    url: '/api/albums/' + photoset.id,
    title: photoset.title,
    photos: photoset.photos.map(function (photo) { return {
      title: photo.title,
      thumbnail: photo.thumbnail,
      url: '/api/photos/' + photo.id
    }; })
  }).then(function () { winston.debug('Finished saving album', {photoset: photoset}); });
}

function saveAlbumsList(photosets) {
  winston.debug('Saving albums list', {photosets: photosets});
  var albums = _.map(photosets, function(photoset) {
    return {
      title: photoset.title,
      thumbnail: _.find(photoset.photos, function (photo) {
        return photo.isprimary;
      }).thumbnail,
      url: '/api/albums/' + photoset.id
    };
  });
  return writeMemcache('/api/albums', _.sortBy(albums, 'title')).then(function () { winston.debug('Finished saving albums list', {photosets: photosets}); });
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
  read: function (url) {
    return readMemcache(url);
  },
  refreshPhotos: function () {
    winston.debug('Refreshing photos');
    return eventReader.retrieveCurrent()
      .then(function(events) {
        return Promise.all(_.map(events, function (event) {
          return readMemcache(event.asset)
            .then(function (photo) { return decoratePhoto(photo, events); })
            .then(function(photo) { return writeMemcache(photo.url, photo); });
        }));
      })
      .then(function() { winston.debug('Finished refreshing photos'); });
  },
  fetchContent: function () {
    winston.info('Fetching content');
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
      .then(savePhotosets)
      .then(function () { winston.info('Finished fetching content'); });
  }
};
