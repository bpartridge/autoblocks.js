(function() {
  var SRCDIR, define;

  if (typeof define !== 'function' && module) define = require('amdefine')(module);

  SRCDIR = '../../../../src/';

  define([SRCDIR + 'specutils', 'underscore'], function(SpecUtils, _) {
    describe('specutils pairs', function() {
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
    return describe('specutils specs', function() {
      var specs;
      specs = [
        {
          id: 'foo',
          children: ['bar', 'baz']
        }, {
          id: 'bar'
        }, {
          id: 'baz'
        }
      ];
      it('should do rootsFor', function() {
        var roots;
        roots = SpecUtils.rootsFor(specs);
        expect(roots.length).toBe(1);
        return expect(roots[0]).toBe(specs[0]);
      });
      return it('should do levelsFor', function() {
        var levels;
        levels = SpecUtils.levelsFor(specs);
        expect(levels.length).toBe(2);
        expect(levels[0].length).toBe(1);
        return expect(levels[1].length).toBe(2);
      });
    });
  });

}).call(this);
