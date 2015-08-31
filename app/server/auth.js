var _ = require('lodash');
var crypto = require('crypto');
var config = require('./config');

var hashes = _.reduce(config.users, function (hashes, user) {
  var key = crypto.createHmac('SHA256', config.secret).update(user).digest('base64');
  hashes[key] = user;
  return hashes;
}, {});

function user(key) {
  return hashes[key];
}

function valid(key) {
  return !!hashes[key];
}

module.exports = {
  valid: valid,
  user: user
};
