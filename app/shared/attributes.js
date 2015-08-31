if (!n) {
  var n = require('./n')(module);
}

if (!_) {
  var _ = require('_');
}

n('piksha.shared', function (ns) {
  ns.attributeDefinitions = _.map([
    {
      name: 'person'
    },
    {
      name: 'year',
      error: function (value) {
        return _.inRange(value, 1920, new Date().getFullYear()) ? '' : 'Year must be from 1920 onwards.';
      },
      unique: true
    }
  ], function (defintion) {
    return _.assign(defintion, {
      valid: function (value) {
        return !this.error || !this.error(value);
      }
    });
  });
});
