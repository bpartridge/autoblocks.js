require(['underscore','../src/lp','../src/tables','../src/sylvester'],
  function(_, LPProblem, Tables, Sylvester) {

  var T = Tables.Table.create;
  var $M = Sylvester.Matrix.create, $V = Sylvester.Vector.create;
  
  describe('lp', function() {
    beforeEach(function() {
      this.addMatchers({
        toEqualMat: function(expected) {
          return this.actual && this.actual.eql(expected);
        },
        toEqualVec: function(expected) {
          return this.actual && this.actual.eql(expected);
        },
        toEqualTable: function(expected) {
          return _.isEqual(this.actual.keys, expected.keys) &&
            _.isEqual(this.actual.data, expected.data);
        },
        toDeepEqual: function(expected) {
          // Ignore constructor equality
          var tempA = _.extend({}, this.actual), tempE = _.extend({}, expected);
          return _.isEqual(tempA, tempE);
        },
        toApprox: function(expected) {
          return Math.abs(this.actual-expected) < Sylvester.precision;
        }
      })
    })
    
    describe('LPProblem', function() {
      var prob;
      beforeEach(function() {prob = new LPProblem();})
      
      it('should maintain all vars in order', function() {
        var c3 = T('x2', 1);
        prob.updateConstraint('c3', c3, 1);
        expect(prob.vars.keys).toDeepEqual(['x2']);

        var c1 = T('x2', 1, 'x1', -1);
        prob.updateConstraint('c1', c1, -1);
        expect(prob.vars.keys).toDeepEqual(['x1', 'x2']);
      })

      it('should update objective coefficients', function() {
        var obj = T('x1', -2, 'x2', 3);
        prob.setObjective(obj);
        expect(prob.objCoeffs.data).toDeepEqual({x1: -2, x2: 3})
      })
    })
    
    describe('solver_chapter_7_example', function() {
      var prob;
      
      beforeEach(function() {
        prob = new LPProblem();
        
        var c1 = T('x1', -1, 'x2', 1);
        prob.updateConstraint('c1', c1, -1);
        var c2 = T('x1', -1, 'x2', -2);
        prob.updateConstraint('c2', c2, -2);
        var c3 = T('x2', 1);
        prob.updateConstraint('c3', c3, 1);
        
        var obj = T('x1', -2, 'x2', 3);
        prob.setObjective(obj);
      })
      
      it('should setup initial matrices', function() {
        var i = 0;
        prob.solve({onSetupDone: function(solver) {
          expect(solver.N).toEqualMat($M([
            [-1,1], [-1,-2], [0,1] ]))
          
          expect(solver.B).toEqualMat($M([
            [1,0,0], [0,1,0], [0,0,1] ]))
          
          expect(solver.Basic).toEqualVec($V([3,4,5]))
          expect(solver.Non).toEqualVec($V([1,2]))
          
          expect(solver.xStar.elements).toEqual([0,0,-1,-2,1])
          expect(solver.zStar.elements).toEqual([2,-3,0,0,0])
          
          i++;
          return false;
        }})
        expect(i).toEqual(1);
      })
      
      it('should allow selection of columns from A', function() {
        var i = 0;
        prob.solve({onSetupDone: function(solver) {
          expect(solver.B).toEqualMat(solver.A.selectColumns(solver.Basic));
          expect(solver.N).toEqualMat(solver.A.selectColumns(solver.Non));
          i++;
          return false;
        }});
        expect(i).toEqual(1);
      })
      
      it('should allow partitioning and merging of initial vectors', function() {
        var i = 0;
        prob.solve({onSetupDone: function(solver) {
          solver.withPartitionedVectors(function(part) {
            expect(part.zStarN.elements).toEqual([2,-3]);
            expect(part.xStarB.elements).toEqual([-1,-2,1]);
            expect(part.zBarN.elements).toEqual([1,1]);
            expect(part.xBarB.elements).toEqual([1,1,1]);
            
            // test merging
            part.zStarN = part.zBarN = $V([0,0]);
            part.xStarB = part.xBarB = $V([0,0,0]);
            i++;
          });
          
          var allZeros = $V([0,0,0,0,0])
          expect(solver.zStar).toEqualVec(allZeros)
          expect(solver.zBar).toEqualVec(allZeros)
          expect(solver.xStar).toEqualVec(allZeros)
          expect(solver.xBar).toEqualVec(allZeros)
          return false;
        }})
        expect(i).toEqual(1);
      })
      
      it('should find first few optimal perturbation values correctly', function() {
        var muStarSpecs = [
          { muStar: 3, muStarIndex: 2, muStarBasic: false },
          { muStar: 4.0/3.0, muStarIndex: 4, muStarBasic: true },
          { muStar: 1.0/2.0, muStarIndex: 4, muStarBasic: false },
          { muStar: -2.0/3.0 }
        ];
        var i = 0;
        
        prob.solve({onMessage: function(msg, details, solver) {
          if (msg == 'computedOptimalPerturbation') {
            if (i < muStarSpecs.length) {
              var muStarSpec = muStarSpecs[i];
              for (key in muStarSpec) {
                expect(solver[key]).toApprox(muStarSpec[key]);
              }
              i++;
            }
          }
        }})
        expect(i).not.toBeLessThan(muStarSpecs.length);
      })
      
      it('should find first B^-1 * N matrix correctly', function() {
        var i = 0;
        prob.solve({onMessage: function(msg, details, solver) {
          if (msg == 'BinvN' && i++ == 0) {
            expect(details).toEqualMat(solver.N);
          }
        }})
        expect(i).toBeGreaterThan(0);
      })
      
      it('should have correct entering and leaving variables', function() {
        var i = 0;
        var expected = [
          {entering:2, leaving:3}, {entering:1, leaving:4},
          {entering:4, leaving:5}
        ]
        prob.solve({onMessage: function(msg, details, solver) {
          if (msg == 'enteringLeavingChosen' && i < expected.length) {
            var spec = expected[i++];
            expect(details.i).toEqual(spec.leaving)
            expect(details.j).toEqual(spec.entering)
          }
        }})
        expect(i).not.toBeLessThan(expected.length)
      })
      
      it('should make the first pivot correctly', function() {
        var i = 0;
        prob.solve({onMessage: function(msg, details, solver) {
          if (msg == 'pivotDone' && ++i == 1) {
            expect(solver.Basic).toEqual($V([2,4,5]));
            expect(solver.Non).toEqual($V([1,3]));
            
            var ABar = solver.B.inverse().multiply(solver.N);
            // note: there is a typo in the textbook, correct values follow
            expect(ABar).toEqualMat($M([
              [-1,1], [-3,2], [1,-1] ]))
            
            expect(solver.xStar.elements).toEqual([0,-1,0,-4,2])
            expect(solver.xBar.elements).toEqual([0,1,0,3,0])
            expect(solver.zStar.elements).toEqual([-1,0,3,0,0])
            expect(solver.zBar.elements).toEqual([2,0,-1,0,0])
          }
        }})
        expect(i).toBeGreaterThan(0);
      })
      
      it('should solve the problem', function() {
        prob.solve();
        expect(prob.vars.data['x2']).toEqual(1);
        expect(prob.vars.data['x1']).toEqual(2);
      })
    })
    
    describe('solver_others', function() {
      it('should do Exercise 7.4', function() {
        var prob = new LPProblem();
        prob.setObjective(T('x1',2,'x2',-6))
        prob.updateConstraint('w1',T('x1',-1,'x2',-1,'x3',-1),-2)
        prob.updateConstraint('w2',T('x1',2,'x2',-1,'x3',1),1)
        prob.solve()
        expect(prob.vars.data['x1']).toApprox(0)
        expect(prob.vars.data['x2']).toApprox(1.0/2.0)
        expect(prob.vars.data['x3']).toApprox(3.0/2.0)
      })
      
      it('should do Exercise 7.5', function() {
        var prob = new LPProblem();
        prob.setObjective({x1:-1, x2:-3, x3:-1})
        prob.updateConstraint('w1',{x1:2, x2:-5, x3:1},-5)
        prob.updateConstraint('w2',{x1:2, x2:-1, x3:2},4)
        prob.solve()
        expect(prob.vars.data).toDeepEqual({x1:0, x2:1, x3:0})
      })
    })
    
  }) // describe
}) // define/require
