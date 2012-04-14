(function() {
  var SRCDIR,
    __hasProp = Object.prototype.hasOwnProperty;

  SRCDIR = '../src/';

  require([SRCDIR + 'autoblocks', SRCDIR + 'specutils', 'underscore', 'util'], function(Autoblocks, SpecUtils, _, util) {
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
            expect(c).toHaveMethod('problemFor');
            return expect(c).toHaveMethod('updatesFrom');
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
        var exampleSpecs, generateBigTree;
        generateBigTree = function(size) {
          var curr, i, parent, specs;
          specs = [];
          for (i = 1; i <= 10; i++) {
            parent = _(SpecUtils.pickRandom(specs)).first();
            curr = {
              id: "id" + i,
              width: Math.random() * 20,
              height: Math.random() * 20
            };
            specs.push(curr);
            if (parent != null) {
              (parent.children || (parent.children = [])).push(curr.id);
            }
          }
          return specs;
        };
        exampleSpecs = {
          empty: [],
          singleNode: [
            {
              id: 'foo',
              width: 20,
              height: 30
            }
          ],
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
          ],
          parentChild: [
            {
              id: 'foo',
              width: 20,
              height: 30,
              children: ['bar']
            }, {
              id: 'bar',
              width: 40,
              height: 10
            }
          ],
          complicated: [
            {
              id: 'foo',
              width: 20,
              height: 30,
              children: ['bar', 'baz']
            }, {
              id: 'bar',
              width: 40,
              height: 10
            }, {
              id: 'baz',
              width: 10,
              height: 40,
              children: ['bazz']
            }, {
              id: 'bazz',
              width: 30,
              height: 30
            }
          ],
          big: generateBigTree(10)
        };
        describe('constrainer', function() {
          var Constrainer;
          Constrainer = Autoblocks.Constrainers.TreeConstrainer;
          return _(exampleSpecs).each(function(specs, name) {
            it("" + name + " was setup", function() {
              var c, prob;
              c = new Constrainer;
              prob = c.problemFor(specs);
              return expect(prob.vars.keys.length).toBe(specs.length * 2);
            });
            return it("" + name + " is solvable", function() {
              var c, nonzero, prob;
              c = new Constrainer;
              prob = c.problemFor(specs);
              prob.solve({
                randomizePerturbations: false
              });
              prob.vars.forEach(function(key, val) {
                return expect(isNaN(val)).toBe(false);
              });
              if (specs.length > 1) {
                nonzero = _(prob.vars.data).chain().values().any(function(val) {
                  return val > 0;
                }).value();
                return expect(nonzero).toBe(true);
              }
            });
          });
        });
        return describe('full', function() {
          return _(exampleSpecs).each(function(specs, name) {
            return it("" + name + " does full updates", function() {
              var nonzero;
              specs = _.clone(specs);
              inst.bind(specs);
              inst.update();
              expect(_(specs).all(function(spec) {
                return spec.centroid != null;
              })).toBe(true);
              if (specs.length > 1) {
                nonzero = _(specs).any(function(spec) {
                  return spec.centroid.x > 0 || spec.centroid.y > 0;
                });
                expect(nonzero).toBe(true);
              }
              return expect(SpecUtils.collide(specs)).toBe(false);
            });
          });
        });
      });
    });
  });

}).call(this);
