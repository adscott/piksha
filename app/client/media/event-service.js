n('piksha.media', function (ns) {
  ns.EventService = {
    create: function () {
      return {
        saveAttributes: function (photoUrl, attributes) {
          return new Promise(function (resolve, reject) {
            var event = {
              type: 'edit-photo',
              asset: photoUrl,
              data: _.map(attributes, function (a) {
                return {
                  value: a.value,
                  name: a.name
                };
              })
            };

            $.ajax({
              type: 'POST',
              url: '/api/events',
              data: JSON.stringify(event),
              contentType: 'application/json'
            }).done(resolve).error(reject);
          });
        }
      };
    }
  };
});
