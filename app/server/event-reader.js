var _ = require('lodash');
var winston = require('winston');
var MongoClient = require('mongodb').MongoClient;
var config = require('./config');

module.exports = {
  retrieveCurrent: function () {
    winston.debug('Fetching events');
    return MongoClient.connect(config.mongodb.url)
      .then(function (db) {
        return db.collection('events').aggregate([
          {$sort: {timestamp: -1}},
          {$group: {_id: '$asset', events: {$push: '$$ROOT'}}},
          {$unwind: {path: '$events', includeArrayIndex: 'arrayIndex' }},
          {$match: {arrayIndex: 0}}
        ]).toArray();
      }, function (err) {
        winston.error('Error connecting to mongodb', {error: err});
        return [];
      })
      .then(function (data) {
        winston.debug('Finished fetching events');
        return _.map(data, 'events');
      }, function (err) {
        winston.error('Error fetching events', {error: err});
        return [];
      });
  }
};
