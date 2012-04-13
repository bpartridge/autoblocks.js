(function() {
  var SRCDIR, define;

  if (typeof define !== 'function' && module) define = require('amdefine')(module);

  SRCDIR = '../../../../src/';

  define([SRCDIR + 'specutils', 'underscore'], function(SpecUtils, _) {
    return describe('specutils pairs', function() {
      var source, spy;
      source = ['a', 'b', 'c'];
      spy = null;
      beforeEach(function() {
        return spy = jasmine.createSpy();
      });
      it('should have definitions', function() {
        expect(SpecUtils.forConsecPairs).toBeDefined();
        return expect(SpecUtils.forAllPairs).toBeDefined();
      });
      it('should perform forConsecPairs', function() {
        SpecUtils.forConsecPairs(source, spy);
        return expect(spy.argsForCall).toEqual([['a', 'b', 0, 1], ['b', 'c', 1, 2]]);
      });
      it('should perform forAllPairs no order', function() {
        SpecUtils.forAllPairs(source, spy);
        return expect(spy.argsForCall).toEqual([['a', 'b', 0, 1], ['a', 'c', 0, 2], ['b', 'c', 1, 2]]);
      });
      return it('should perform forAllPairs ordered', function() {
        SpecUtils.forAllPairs(source, spy, true);
        return expect(spy.argsForCall).toEqual([['a', 'b', 0, 1], ['a', 'c', 0, 2], ['b', 'a', 1, 0], ['b', 'c', 1, 2], ['c', 'a', 2, 0], ['c', 'b', 2, 1]]);
      });
    });
  });

}).call(this);
