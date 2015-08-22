n('piksha.application', function (ns) {
  var callbacks = [];
  ns.Router = {
    instance: function () {
      return {
        changeRoute: function (route, params) {
          params = params || {};
          _.each(callbacks, function (callback) { callback(route, params); });
        },
        subscribe: function (callback) {
          callbacks.push(callback);
        }
      };
    }
  };
});
