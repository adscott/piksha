var _ = require('lodash');
var crypto = require('crypto');
var config = require('./config');

_.each(config.users, function (user) {
  var key = crypto.createHmac('SHA256', config.secret).update(user).digest('base64');
  console.log(user + ': ' + key);
});
