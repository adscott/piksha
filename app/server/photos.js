var Promise = require('promise');
var Memcached = require('memcached');
var _ = require('lodash');
var crypto = require('crypto');
var https = require('https');

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

  var baseUrl = 'https://api.flickr.com/services/rest';
  var baseQueryString = queryString(parameters);
  var signable = 'GET&' + encodeURIComponent(baseUrl) + '&' + encodeURIComponent(baseQueryString);
  var oauthSignature = sign(signable, config.flickr.oauthClientSecret, config.flickr.oauthTokenSecret);
  var url = baseUrl + '?' + baseQueryString + '&oauth_signature=' + oauthSignature;

  return new Promise(function (resolve) {
    https.get(url, function (res) {
      var data = '';

      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        resolve(JSON.parse(data));
      });
    });
  });
}

module.exports = {
  readAlbums: function () {
    return new Promise(function (resolve, reject) {
      memcached.get('albums', function (err, result) {
        if (err) {
          reject();
        } else {
          resolve(JSON.parse(result));
        }
      });
    });
  },
  fetchContent: function () {
    callFlickr({method: 'flickr.photosets.getList'})
      .then(function (list) {
        var photosets = list.photosets.photoset;
        return Promise.all(_.map(photosets, function (photoset) {
          return callFlickr({
            method: 'flickr.photos.getSizes',
            photo_id: photoset.primary
          });
        })).then(function (primaries) {
          return _.map(photosets, function (photoset, index) {
            return {
              url: '/albums/' + photoset.id,
              title: photoset.title,
              thumbnail: _.find(primaries[index].sizes.size, function (size) { return size.label === 'Large Square'; }).source
            };
          });
        });
      })
      .then(function (albums) {
        memcached.set('albums', JSON.stringify(albums), 0, function (err) {
          if (err) throw new Error(err);
        });
      });
  }
};
