n('piksha.media', function (ns) {

  ns.MediaService = {
    create: function () {
      return {
        albums: function () {
          return new Promise(function (resolve) {
            $.get('/api/albums').done(resolve);
          });
        },
        asset: function (url) {
          return new Promise(function (resolve) {
            $.get(url).done(resolve);
          });
        }
      };
    }
  };
});
