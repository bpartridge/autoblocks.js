(function() {
  var SRCDIR, define,
    __hasProp = Object.prototype.hasOwnProperty;

  if (typeof define !== 'function' && module) define = require('amdefine')(module);

  SRCDIR = '../../../../src/';

  define([SRCDIR + 'autoblocks', 'underscore'], function(Autoblocks, _) {
    return describe('autoblocks', function() {
      var inst;
      inst = null;
      beforeEach(function() {
        inst = Autoblocks.create();
        return this.addMatchers({
          toDeepEqual: function(expected) {
            return _.isEqual(this.actual, expected);
          },
          toHaveMethod: function(method) {
            return _.isFunction(this.actual[method]);
          }
        });
      });
      describe('instance', function() {
        return it('should not be null', function() {
          expect(inst).toBeDefined();
          return expect(inst).not.toBeNull();
        });
      });
      describe('binders', function() {
        var Binder, binderName, _ref;
        it('instance should have ObjectBinder as default', function() {
          return expect(inst.binder.constructor).toEqual(Autoblocks.Binders.ObjectBinder);
        });
        _ref = Autoblocks.Binders;
        for (binderName in _ref) {
          if (!__hasProp.call(_ref, binderName)) continue;
          Binder = _ref[binderName];
          it("" + binderName + " should follow the interface", function() {
            var binder;
            binder = new Binder;
            expect(binder).toHaveMethod('bind');
            expect(binder).toHaveMethod('specs');
            return expect(binder).toHaveMethod('onUpdates');
          });
        }
        return it("ObjectBinder should update on updates", function() {
          var binder, obj;
          binder = new Autoblocks.Binders.ObjectBinder;
          obj = {
            id: "foo",
            centroid: {
              x: 1,
              y: 2
            },
            width: 3,
            height: 4
          };
          binder.bind(obj);
          binder.onUpdates([
            {
              id: "foo",
              centroid: {
                x: 5,
                y: 6
              }
            }
          ]);
          expect(obj.centroid.x).toEqual(5);
          return expect(obj.centroid.y).toEqual(6);
        });
      });
      return describe('constrainers', function() {
        var Constrainer, constrainerName, _ref, _results;
        _ref = Autoblocks.Constrainers;
        _results = [];
        for (constrainerName in _ref) {
          if (!__hasProp.call(_ref, constrainerName)) continue;
          Constrainer = _ref[constrainerName];
          _results.push(it("" + constrainerName + " should follow the interface", function() {
            var c;
            c = new Constrainer;
            return expect(c).toHaveMethod('problemFor');
          }));
        }
        return _results;
      });
    });
  });

}).call(this);
