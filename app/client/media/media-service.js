n('piksha.media', function (ns) {

  ns.MediaService = {
    create: function () {
      return {
        albums: function () {
          return new Promise(function (resolve, reject) {
            $.get('/api/albums').done(resolve).error(reject);
          });
        },
        asset: function (url) {
          return new Promise(function (resolve, reject) {
            $.get(url).done(resolve).error(reject);
          });
        }
      };
    }
  };
});
