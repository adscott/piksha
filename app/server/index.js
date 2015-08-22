var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var forceSSL = require('express-force-ssl');

var auth = require('./auth');
var photos = require('./photos');

var config = require('/etc/piksha/config');
var clientDir = path.join(__dirname, '../client');

var app = express();

app.set('httpsPort', config.publicHttpsPort);

app.use(forceSSL);
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/n-js', express.static(path.join(__dirname, '../../node_modules/n-js/')));
app.use('/lodash', express.static(path.join(__dirname, '../../node_modules/lodash/')));
app.use('/jquery', express.static(path.join(__dirname, '../../node_modules/jquery/dist/')));
app.use('/react', express.static(path.join(__dirname, '../../node_modules/react/dist/')));
app.use('/client', express.static(path.join(clientDir)));

app.get('/', function (req, res) {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.post('/auth', function (req, res) {
  res.clearCookie('key');
  var key = req.body.key;
  if(auth.valid(key)) {
    res.cookie('key', key);
    res.redirect('/api/');
  } else {
    res.status(401).send({message: 'invalid key'});
  }
});

app.all('/api/*', function (req,res,next) {
  if (auth.valid(req.cookies.key)) {
    next();
  } else {
    res.status(401).send({auth: '/auth'});
  }
});

app.get('/api/', function (req, res) {
  res.send({
    user: auth.user(req.cookies.key),
    albums: '/api/albums/'
  });
});

app.get('/api/albums/', function (req, res) {
  photos.readAlbums().then(function (albums) {
    res.send(albums);
  });
});

app.get('/api/albums/:albumId', function (req, res) {
  photos.readAlbum(req.params.albumId).then(function (album) {
    res.send(album);
  });
});

http.createServer(app).listen(config.httpPort);
https.createServer({
  key: fs.readFileSync(config.sslKey),
  cert: fs.readFileSync(config.sslCert)
}, app).listen(config.httpsPort);

setInterval(photos.fetchContent, 60 * 60 * 1000);
photos.fetchContent();
