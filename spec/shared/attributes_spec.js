describe('attributes', function () {
  var service = require('../../app/shared/attributes').AttributesService.create();
  var errors;

  describe('when attributes are valid', function () {
    beforeEach(function () {
      errors = service.errors([{id: 123, name: 'year', value: '1980'}]);
    });

    it('should return no errors', function () {
      expect(errors).toEqual({});
    });
  });

  describe('when an attribute is invalid', function () {
    beforeEach(function () {
      errors = service.errors([{id: 123, name: 'year', value: '1980'}, {id: 456, name: 'month', value: 'foobar'}]);
    });

    it('should return an error', function () {
      expect(errors).toEqual({456: 'Input a month, e.g. January'});
    });
  });
});
