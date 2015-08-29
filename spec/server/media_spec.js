var proxyquire = require('proxyquire');
var _ = require('lodash');

describe('media', function () {

  var cache, flickrResponses;

  var memcachedStub = function () {
    this.set = function (key, value, timeout, callback) {
      cache[key] = value;
      callback();
    };
    this.get = function (key, callback) {
      callback(null, cache[key]);
    };
  };
  var needleStub = {
    get: function (url, callback) {
      var method = require('url').parse(url, true).query.method;
      var response = {
        body: flickrResponses[method](url)
      };
      callback(null, response);
    }
  };
  var limiterStub = {
    RateLimiter: function () {
      this.removeTokens = function (token, callback) {
        callback();
      };
    }
  };

  var media = proxyquire('../../app/server/media', {
    memcached: memcachedStub,
    needle: needleStub,
    limiter: limiterStub
  });

  beforeEach(function () {
    cache = {};
    flickrResponses = {
      'flickr.photosets.getList': function () {
        return {
          photosets: {
            photoset: [{ id:'123456' }, { id: '789123' }, { id: '456789' }]
          }
        };
      },
      'flickr.photosets.getPhotos': function (url) {
        var id = require('url').parse(url, true).query.photoset_id;
        return {
          photoset:{
            id: id,
            primary: '1',
            title: id + ' set',
            photo: [
              {
                id: '1' + id,
                secret: 'secret1',
                server: '100',
                farm: 21,
                title: 'Title 1',
                isprimary: '1'
              },
              {
                id: '2' + id,
                secret: 'secret2',
                server: '200',
                farm: 22,
                title: 'Title 2',
                isprimary: '0'
              },
              {
                id: '3' + id,
                secret: 'secret3',
                server: '300',
                farm: 23,
                title: 'Title 3',
                isprimary: '0'
              }
            ]
          }
        };
      }
    };
  });

  describe('after fetching content', function () {
    beforeEach(function (done) {
      media.fetchContent().then(done);
    });

    describe('when reading albums', function () {
      var albums;

      beforeEach(function (done) {
        media.readAlbums().then(function (albumsRead) {
          albums = albumsRead;
          done();
        });
      });

      it('should populate the list', function () {
        expect(albums.length).toBe(3);
      });

      it('should assign a thumbnail', function () {
        expect(albums[0].thumbnail).toBe('https://farm21.staticflickr.com/100/1123456_secret1_q.jpg');
      });

      it('should assign a title', function () {
        expect(albums[0].title).toBe('123456 set');
      });

      it('should assign a url', function () {
        expect(albums[0].url).toBe('/api/albums/123456');
      });

      it('should sort albums alphabetically', function () {
        expect(_.pluck(albums, 'title')).toEqual(['123456 set', '456789 set', '789123 set']);
      });
    });

    describe('when reading an album', function () {
      var album;

      beforeEach(function (done) {
        media.readAlbum('123456').then(function (albumRead) {
          album = albumRead;
          done();
        });
      });

      it('should assign a title', function () {
        expect(album.title).toBe('123456 set');
      });

      it('should assign photos', function () {
        expect(album.photos.length).toBe(3);
      });

      it('should assign a thumbnail to photos', function () {
        expect(album.photos[0].thumbnail).toBe('https://farm21.staticflickr.com/100/1123456_secret1_q.jpg');
      });

      it('should assign a title to photos', function () {
        expect(album.photos[0].title).toBe('Title 1');
      });

      it('should assign a url to photos', function () {
        expect(album.photos[0].url).toBe('/api/photos/1123456');
      });
    });

    describe('when reading a photo', function () {
      var photo;

      beforeEach(function (done) {
        media.readPhoto('1123456').then(function (photoRead) {
          photo = photoRead;
          done();
        });
      });

      it('should assign a title', function () {
        expect(photo.title).toBe('Title 1');
      });

      it('should assign a thumbnail to photos', function () {
        expect(photo.thumbnail).toBe('https://farm21.staticflickr.com/100/1123456_secret1_q.jpg');
      });

      it('should assign a full image to photos', function () {
        expect(photo.full).toBe('https://farm21.staticflickr.com/100/1123456_secret1_b.jpg');
      });

      it('should assign an album url to photos', function () {
        expect(photo.album).toBe('/api/albums/123456');
      });
    });
  });


});
