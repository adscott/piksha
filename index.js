var express = require('express');
var app = express();
var config = require('/etc/piksha/config')

app.get('/', function (req, res) {
  res.send(config.greeting);
});

app.listen(config.port);
