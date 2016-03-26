var Promise = require('promise');
var _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;

var config = require('./config');
var AttributesService = require('../shared/attributes').AttributesService;

var apiPhotoBase = '/api/photos/';
var expectedKeys = ['type', 'asset', 'data'];

function photoIdFromURL(photoUrl) {
  return photoUrl.slice(apiPhotoBase.length);
}

var basicValidations = [
  function (event) { return expectedKeys.length === _.intersection(expectedKeys, _.keys(event)).length; },
  function (event) { return _.includes(['edit-photo'], event.type); },
  function (event) { return event.asset.indexOf(apiPhotoBase) === 0; },
  function (event) { return event.asset.split('/').length === 4; },
  function (event) { return _.isArray(event.data); },
  function (event) { return _.isEmpty(AttributesService.create().errors(event.data)); }
];

module.exports = {
  validate: function (event) {
    return Promise.resolve(_.every(basicValidations, function (validation) { return validation(event); }))
      .then(function (result) {
        return result ? require('./media').readPhoto(photoIdFromURL(event.asset)) : false;
      }, function () { return false; })
      .then(function(result) {
        return !!result;
      }, function () { return false; });
  },
  persist: function (event, user) {
    var e = _.assign(event, {
      user: user,
      timestamp: new Date()
    });

    return MongoClient.connect(config.mongodb.url)
      .then(function (db) {
        return db.collection('events').insert(e);
      })
      .then(function() {
        return require('./media').refreshPhoto(photoIdFromURL(event.asset));
      });
  }
};
