var _ = require('lodash');
var config = require('/etc/piksha/config');
var crypto = require('crypto');

_.each(config.users, function (user) {
  var key = crypto.createHmac('SHA256', config.secret).update(user).digest('base64');
  console.log(user + ': ' + key);
});
