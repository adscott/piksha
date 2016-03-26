var Promise = require('promise');
var _ = require('lodash');
var media = require('./media');
var AttributesService = require('../shared/attributes').AttributesService;

var apiPhotoBase = '/api/photos/';
var expectedKeys = ['type', 'asset', 'data'];

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
    return new Promise(function (resolve) { resolve(_.every(basicValidations, function (validation) { return validation(event); })); })
      .then(function (result) {
        return result ? media.readPhoto(event.asset.slice(apiPhotoBase.length)).then(function () { return true; }, function () { return false; }) : false;
      }, function () {
        return false;
      });
  },
  persist: function () {
    return new Promise(function (resolve) { resolve(); });
  }
};
