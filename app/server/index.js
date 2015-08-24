var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var forceSSL = require('express-force-ssl');
var sass    = require('node-sass');
var neat = require('node-neat');


var auth = require('./auth');
var media = require('./media');

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

app.get('/client/styles/main.css', function (req, res) {
  sass.render({
    file: path.join(clientDir, 'styles/main.scss'),
    includePaths: neat.includePaths,
    outputStyle: 'compressed'
  }, function (err, result) {
    res.set('Content-Type', 'text/css');
    if (err) {
      res.status(500).send('');
    } else {
      res.send(result.css);
    }
  });
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
  media.readAlbums().then(function (albums) {
    res.send(albums);
  }, function () {
    res.status(404).send('');
  });
});

app.get('/api/albums/:albumId', function (req, res) {
  media.readAlbum(req.params.albumId).then(function (album) {
    res.send(album);
  }, function () {
    res.status(404).send('');
  });
});

app.get('/api/photos/:photoId', function (req, res) {
  media.readPhoto(req.params.photoId).then(function (photo) {
    res.send(photo);
  }, function () {
    res.status(404).send('');
  });
});


media.fetchContent().then(function () {
  http.createServer(app).listen(config.httpPort);
  https.createServer({
    key: fs.readFileSync(config.sslKey),
    cert: fs.readFileSync(config.sslCert),
    ca: fs.readFileSync(config.sslBundle)
  }, app).listen(config.httpsPort);
});

setInterval(media.fetchContent, 24 * 60 * 60 * 1000);
