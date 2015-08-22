n('piksha.auth', function (ns) {
  ns.KeyService = {
    create: function () {
      return {
        authenticate: function (value) {
          return new Promise(function (resolve, reject) {
            $.ajax('/auth', {
              method: 'POST',
              data: JSON.stringify({key: value}),
              contentType: 'application/json'
            })
              .done(function (data) { resolve(data.user); })
              .fail(reject);
          });
        },
        currentUser: function () {
          return new Promise(function (resolve, reject) {
            $.ajax('/api/', {
              method: 'GET',
              contentType: 'application/json'
            })
              .done(function (data) { resolve(data.user); })
              .fail(reject);
          });
        }
      };
    }
  };
});
