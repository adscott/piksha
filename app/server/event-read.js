var MongoClient = require('mongodb').MongoClient;
var config = require('./config');


module.exports = {
  retrieve: function (photoUrl) {
    return MongoClient.connect(config.mongodb.url)
      .then(function (db) {
        return db.collection('events').find({asset: photoUrl}).sort({timestamp: -1}).toArray();
      });
  }
};
