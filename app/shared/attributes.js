if (!n) {
  var n = require('./n')(module);
}

if (!_) {
  var _ = require('lodash');
}

n('piksha.shared', function (ns) {
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var definitions = [
    {
      name: 'person'
    },
    {
      name: 'month',
      error: function (value) {
        return _.contains(months, value) ? '' : 'Input a month, e.g. January';
      },
      groupError: function (values) {
        if (values.length > 0 && _.all(values, function (value) { return _.contains(months, value); })) {
          var sortedValues = _.sortBy(values, function (value) { return _.indexOf(months, value); });
          var index = _.indexOf(months, sortedValues[0]);
          return _.eq(_.slice(months, index, sortedValues.length + index), sortedValues) ? '' : 'Months must be contiguous.';
        } else {
          return '';
        }
      }
    },
    {
      name: 'year',
      error: function (value) {
        return _.inRange(value, 1920, new Date().getFullYear()) ? '' : 'Year must be from 1920 onwards.';
      },
      unique: true
    },
    {
      name: 'locality',
      unique: true
    },
    {
      name: 'country',
      unique: true
    },
    {
      name: 'event',
      unique: true
    },
    {
      name: 'subject'
    }
  ];


  ns.AttributesService = {
    create: function () {
      return {
        definitions: function () {
          return definitions;
        },
        definitionByName: function (name) {
          return _.find(definitions, function (a) { return name === a.name; });
        },
        errors: function (attributes) {
          return _.reduce(attributes, function (errors, attribute) {
            var definition = this.definitionByName(attribute.name);
            var groupValues = _(attributes).filter(function (a) { return attribute.name === a.name; }).pluck('value').value();

            if (definition.groupError && definition.groupError(groupValues)) {
              errors[attribute.id] = definition.groupError(groupValues);
            }

            if (definition.error && definition.error(attribute.value)) {
              errors[attribute.id] = definition.error(attribute.value);
            }

            return errors;
          }, {}, this);
        }
      };
    }
  };
});
