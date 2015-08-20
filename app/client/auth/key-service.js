n('piksha.auth', function (ns) {
  ns.KeyService = {
    instance: function () {
      return {
        authenticate: function (value) {
          return new Promise(function (resolve, reject) {
            $.ajax({
              url: '/api/?key=' + encodeURIComponent(value),
              dataType: 'json',
              cache: false,
              success: function (data) {
                resolve(data.user);
              },
              error: function () {
                reject();
              }
            });
          });
        }
      };
    }
  };
});
