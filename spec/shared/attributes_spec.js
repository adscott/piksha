describe('attributes', function () {
  var service = require('../../app/shared/attributes').AttributesService.create();
  var errors;

  describe('when attributes are valid', function () {
    beforeEach(function () {
      errors = service.errors([{id: 'piksha123', name: 'year', value: '1980'}]);
    });

    it('should return no errors', function () {
      expect(errors).toEqual({});
    });
  });

  describe('when an attribute is invalid', function () {
    beforeEach(function () {
      errors = service.errors([{id: 'piksha123', name: 'year', value: '1980'}, {id: 'piksha456', name: 'month', value: 'foobar'}]);
    });

    it('should return an error', function () {
      expect(errors).toEqual({piksha456: 'Input a month, e.g. January'});
    });
  });

  describe('when an attribute is empty', function () {
    beforeEach(function () {
      errors = service.errors([{id: 'piksha456', name: 'subject', value: ''}]);
    });

    it('should return an error', function () {
      expect(errors).toEqual({piksha456: 'Attributes cannot be blank.'});
    });
  });

  describe('when an attribute is blank', function () {
    beforeEach(function () {
      errors = service.errors([{id: 'piksha456', name: 'subject', value: '    '}]);
    });

    it('should return an error', function () {
      expect(errors).toEqual({piksha456: 'Attributes cannot be blank.'});
    });
  });

  describe('when there are multiple months', function () {
    describe('when values are contiguous', function () {
      beforeEach(function () {
        errors = service.errors([
          {id: 'piksha123', name: 'month', value: 'April'},
          {id: 'piksha456', name: 'month', value: 'June'},
          {id: 'piksha789', name: 'month', value: 'May'}
        ]);
      });
      it('should return no errors', function () {
        expect(errors).toEqual({});
      });
    });
    describe('when values are not contiguous', function () {
      beforeEach(function () {
        errors = service.errors([
          {id: 'piksha123', name: 'month', value: 'July'},
          {id: 'piksha456', name: 'month', value: 'January'}
        ]);
      });
      it('should return errors', function () {
        expect(errors).toEqual({
          'piksha123': 'Months must be contiguous.',
          'piksha456': 'Months must be contiguous.'
        });
      });
    });
  });
});
