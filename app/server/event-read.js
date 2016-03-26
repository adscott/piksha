var winston = require('winston');
var MongoClient = require('mongodb').MongoClient;
var config = require('./config');

module.exports = {
  retrieve: function (photoUrl) {
    winston.debug('Fetching events');
    return MongoClient.connect(config.mongodb.url)
      .then(function (db) {
        return db.collection('events').find({asset: photoUrl}).sort({timestamp: -1}).toArray();
      }, function (err) {
        winston.error('Error connecting to mongodb', {error: err});
        return [];
      })
      .then(function (events) {
        winston.debug('Finished fetching events');
        return events;
      }, function (err) {
        winston.error('Error fetching events', {error: err});
        return [];
      });
  }
};
