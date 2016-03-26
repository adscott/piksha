n('piksha.media', function (ns) {
  ns.EventService = {
    create: function () {
      return {
        saveAttributes: function () {
          return new Promise(function (resolve) {
            resolve();
          });
        }
      };
    }
  };
});
