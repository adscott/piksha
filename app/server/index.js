var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var express = require('express');
var forceSSL = require('express-force-ssl');

var auth = require('./auth');

var config = require('/etc/piksha/config');
var clientDir = path.join(__dirname, '../client');

var app = express();

app.set('httpsPort', config.publicHttpsPort);

app.use(forceSSL);
app.use('/n-js', express.static(path.join(__dirname, '../../node_modules/n-js/')));
app.use('/lodash', express.static(path.join(__dirname, '../../node_modules/lodash/')));
app.use('/jquery', express.static(path.join(__dirname, '../../node_modules/jquery/dist/')));
app.use('/react', express.static(path.join(__dirname, '../../node_modules/react/dist/')));
app.use('/client', express.static(path.join(clientDir)));

app.get('/', function (req, res) {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.all('/api/*',function(req,res,next){
  if(auth.valid(req.query.key)){
    next();
  }else{
    res.status(401).send({message: 'invalid token'});
  }
});

app.get('/api/', function (req, res) {
  res.send({user: auth.user(req.query.key)});
});

var options = {
  key: fs.readFileSync(config.sslKey),
  cert: fs.readFileSync(config.sslCert)
};

http.createServer(app).listen(config.httpPort);
https.createServer(options, app).listen(config.httpsPort);
