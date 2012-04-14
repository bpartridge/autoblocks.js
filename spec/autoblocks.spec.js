(function() {
  var SRCDIR, define,
    __hasProp = Object.prototype.hasOwnProperty;

  if (typeof define !== 'function' && module) define = require('amdefine')(module);

  SRCDIR = '../../../../src/';

  define([SRCDIR + 'autoblocks', 'underscore', 'util'], function(Autoblocks, _, util) {
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
      describe('constrainers', function() {
        var Constrainer, constrainerName, _ref, _results;
        _ref = Autoblocks.Constrainers;
        _results = [];
        for (constrainerName in _ref) {
          if (!__hasProp.call(_ref, constrainerName)) continue;
          Constrainer = _ref[constrainerName];
          it("" + constrainerName + " should follow the interface", function() {
            var c;
            c = new Constrainer;
            return expect(c).toHaveMethod('problemFor');
          });
          _results.push(it("" + constrainerName + " should handle a blank spec list", function() {
            var c, prob;
            c = new Constrainer;
            prob = c.problemFor([]);
            expect(prob.vars.empty()).toEqual(true);
            return expect(prob.objCoeffs.empty()).toEqual(true);
          }));
        }
        return _results;
      });
      return describe('treeExamples', function() {
        var exampleSpecs;
        exampleSpecs = {
          parallelRoots: [
            {
              id: 'foo',
              width: 5,
              height: 10
            }, {
              id: 'bar',
              width: 10,
              height: 20
            }
          ]
        };
        return describe('constrainer', function() {
          var Constrainer, name, specs, _results;
          Constrainer = Autoblocks.Constrainers.TreeConstrainer;
          _results = [];
          for (name in exampleSpecs) {
            if (!__hasProp.call(exampleSpecs, name)) continue;
            specs = exampleSpecs[name];
            it("" + name + " was setup", function() {
              var c, prob;
              c = new Constrainer;
              prob = c.problemFor(specs);
              return expect(prob.vars.keys.length).toBeGreaterThan(specs.length - 1);
            });
            _results.push(it("" + name + " is solvable", function() {
              var c, prob;
              c = new Constrainer;
              prob = c.problemFor(specs);
              prob.solve({
                onMessage: function(msg, details) {
                  return console.log(msg, details);
                },
                randomizePerturbations: true
              });
              prob.vars.forEach(function(key, val) {
                return expect(isNaN(val)).toBe(false);
              });
              return console.log(util.inspect(prob, false, 10, true));
            }));
          }
          return _results;
        });
      });
    });
  });

}).call(this);
