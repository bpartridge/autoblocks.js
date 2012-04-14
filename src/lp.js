define(function(require) {

  var Sylvester = require('./sylvester'),
    Matrix = Sylvester.Matrix,
    Vector = Sylvester.Vector,
    _ = require('underscore'),
    Tables = require('./tables'),
    Table = Tables.Table,
    SortedTable = Tables.SortedTable;

  require('./sylvester-extensions');
  
  var DEFAULT_VALUE = 0;
  var DEBUG = false;
  var MAX_PIVOTS = 50;
  
  var LPProblem = function() {
    this.vars = new SortedTable();
    this.constraints = new SortedTable();
    // this.constraintsUpdated = new SortedTable();
    this.objCoeffs = new SortedTable();
    this.objUpdated = false;
    this.objective = DEFAULT_VALUE;
  }
  
  _.extend(LPProblem.prototype, {
    
    // add or update a constraint, marking it as updated
    updateConstraint: function(name, coeffs, leqRhs) {
      var coeffTable;
      if (coeffs && coeffs.keys && coeffs.data) coeffTable = coeffs;
      else {
        coeffTable = new Table();
        for (key in coeffs) { coeffTable.put(key, coeffs[key]); }
      }
      var constraint = {
        coeffs: coeffTable, rhs: leqRhs
      }
      this.constraints.put(name, constraint);
      // this.constraintsUpdated.put(name, true);
      coeffTable.forEach(function(key, value) {
        this.vars.add(key, DEFAULT_VALUE);
      }, this);
    },
    
    setObjective: function(coeffs) {
      if (coeffs && coeffs.forEach) {
        coeffs.forEach(function(key, value) {
          this.objCoeffs.put(key, value);
          this.vars.add(key, DEFAULT_VALUE);
        }, this);
      } else if (coeffs) {
        for (key in coeffs) {
          this.objCoeffs.put(key, coeffs[key]);
          this.vars.add(key, DEFAULT_VALUE);
        }
      }
    },
    
    setValues: function(vals) {
      if (vals && vals.forEach) {
        vals.forEach(function(key, value) {
          this.vars.put(key, value);
        }, this);
      } else if (vals) {
        for (key in vals) {
          this.vars.put(key, vals[key]);
        }
      }
    },
    
    solve: function(options) {
      var solver = new LPSolver(this, options);
      if (!options || !options.setupOnly) // check for testing
        return solver.solve();
      return false;
    },
  });
  
  // Uses parametric self-dual simplex method with notation from
  // Vanderbei, Linear Programming: Foundations and Extensions
  // onMessage is called with (eventName, details, solver)
  // onSetupDone is called with (solver), return false to stop
  var LPSolver = function(problem, options) {
    this.problem = problem;
    this.options = options || {};
    this.setup();
  }
  
  /* Notation for solver: 
  */
  
  _.extend(LPSolver.prototype, {
    
    // calls the callback, returning true if the callback does
    message: function(msg, details) {
      if (DEBUG) console.log(msg, details && details.inspect ? '\n'+details.inspect() : details);
      if (this.options.onMessage) return this.options.onMessage(msg, details, this);
      else return false;
    },
    
    setup: function() {
      
      // counts
      var nBasic = this.nBasic = this.problem.constraints.keys.length;
      var nNon = this.nNon = this.problem.vars.keys.length;
      var nVars = this.nVars = nBasic + nNon;
      
      // initial matrices
      var N = this.N = Matrix.Zero(nBasic, nNon).
        map(_.bind(function(_zero, iConstraint, iVar) {
          var varName = this.problem.vars.keys[iVar-1];
          var kConstraint = this.problem.constraints.keys[iConstraint-1];
          var constraint = this.problem.constraints.data[kConstraint];
          var coeff = constraint.coeffs.data[varName];
          return coeff || 0;
        }, this));
      var B = this.B = Matrix.I(nBasic);
      var A = this.A = N.augment(B);
      
      // index vectors
      var Non = this.Non = Vector.Zero(nNon).map(function(_, i) {
        return i;
      });
      var Basic = this.Basic = Vector.Zero(nBasic).map(function(_, i) {
        return i + nNon;
      });
      
      // z and x vectors
      var zStar = this.zStar = Vector.Zero(nVars).map(_.bind(function(_, i) {
        if (i > this.nNon) return 0;
        var varName = this.problem.vars.keys[i-1];
        var objCoeff = this.problem.objCoeffs.data[varName];
        return (-objCoeff || 0);
      }, this));
      
      var xStar = this.xStar = Vector.Zero(nVars).map(_.bind(function(_, i) {
        if (i <= this.nNon) return 0;
        var iConstraint = i - this.nNon;
        var kConstraint = this.problem.constraints.keys[iConstraint-1];
        var constraint = this.problem.constraints.data[kConstraint];
        var rhs = constraint.rhs;
        return rhs;
      }, this));
      
      // arbitrary perturbation vectors, start as ones where necessary
      var zBar = this.zBar = Vector.Zero(nVars);
      var xBar = this.xBar = Vector.Zero(nVars);
      
      this.withPartitionedVectors(function(part) {
        // from page 118 of Vanderbei, to avoid degenerate dictionaries
        if (this.options && this.options.randomizePerturbations) {
          part.xBarB = part.xBarB.map(function() {return Math.random();});
          part.zBarN = part.zBarN.map(function() {return Math.random();});
        }
        else {
          part.xBarB = part.xBarB.map(function() {return 1;});
          part.zBarN = part.zBarN.map(function() {return 1;});
        }
      });
      
      this.message('setupDone');
      if (this.options.onSetupDone && !this.options.onSetupDone(this))
        this.setupOnly = true;
    },
    
    withPartitionedVectors: function(func) {
      var partitioned = {
        zStarN: this.zStar.subscript(this.Non),
        xStarB: this.xStar.subscript(this.Basic),
        zBarN: this.zBar.subscript(this.Non),
        xBarB: this.xBar.subscript(this.Basic)
      };
      
      func(partitioned);
      
      this.zStar.setSubscript(this.Non, partitioned.zStarN);
      this.xStar.setSubscript(this.Basic, partitioned.xStarB);
      if (this.zBar) this.zBar.setSubscript(this.Non, partitioned.zBarN);
      if (this.xBar) this.xBar.setSubscript(this.Basic, partitioned.xBarB);
    },
    
    /*
    muStar = min{mu: zStarN + mu*zBarN >= 0 and xStarB + mu*xBarB >= 0}
    Sets properties: muStar(Number), muStarIndex(1:nVars), muStarBasic(boolean)
    */
    computeOptimalPerturbation: function() {
      var iMax = -1, jMax = -1,
        maxBasic = -Infinity, maxNon = -Infinity;
      for (var idxBasic = 0; idxBasic < this.nBasic; idxBasic++) {
        var i = this.Basic.elements[idxBasic];
        var xBarI = this.xBar.elements[i-1];
        if (xBarI > 0) {
          var xStarI = this.xStar.elements[i-1];
          var val = (0.0-xStarI) / xBarI; // force floating point
          if (val > maxBasic) {maxBasic = val; iMax = i;}
        }
      }
      this.message('muStarBasic', ['i', iMax, 'val', maxBasic]);
      
      for (var idxNon = 0; idxNon < this.nNon; idxNon++) {
        var j = this.Non.elements[idxNon];
        var zBarJ = this.zBar.elements[j-1];
        if (zBarJ > 0) {
          var zStarJ = this.zStar.elements[j-1];
          var val = (0.0-zStarJ) / zBarJ;
          if (val > maxNon) {maxNon = val; jMax = j;}
        }
      }
      this.message('muStarNon', ['j', jMax, 'val', maxNon]);
      
      // TODO: handle -Infinity gracefully
      if (maxBasic >= maxNon) {
        this.muStar = maxBasic; this.muStarIndex = iMax; this.muStarBasic = true;
      }
      else {
        this.muStar = maxNon; this.muStarIndex = jMax; this.muStarBasic = false;
      }
      this.message('computedOptimalPerturbation', this.muStar);

      this.updateProblem();
    },
    
    solve: function() {
      if (this.setupOnly) return false;
      this.nPivots = 0;
      
      if (DEBUG) this.message('DEBUG', '-------STARTING SOLVE-------')
      
      this.computeOptimalPerturbation();
      while (this.muStar > 0 && this.nPivots < MAX_PIVOTS) {
        // note: muStar guaranteed to be floating point
        
        if (DEBUG) {
          this.message('DEBUG:Basic', [this.Basic.inspect()])
          this.message('DEBUG:Non', [this.Non.inspect()])
          this.message('DEBUG:xStar, xBar', [this.xStar.inspect(), this.xBar.inspect()])
          this.message('DEBUG:zStar, zBar', [this.zStar.inspect(), this.zBar.inspect()])
        }
        
        // TODO: use implementation recommendations to make this quicker
        var BinvN = this.B.inverse().multiply(this.N);
        this.message('BinvN', BinvN);
        
        var dzN, dxB; // delta z_Non and delta x_Basic
        var i = -1, j = -1; // one from computeOptimalPerturbation, one from below
        
        if (this.muStarBasic) { // if max is achieved by i in Basic
          i = this.muStarIndex;
          var e_i = Vector.Basis(this.nVars, i).subscript(this.Basic);
          dzN = BinvN.transpose().multiply(e_i).multiply(-1);
          
          // pick j from argmax_(j in Non) (dz_j / (zStar_j + muStar*zBar_j))
          var max = -Infinity;
          for (var idx = 0; idx < this.nNon; idx++) {
            var currJ = this.Non.elements[idx];
            var num = dzN.elements[idx];
            var denom = this.zStar.elements[currJ-1] + 
              this.muStar * this.zBar.elements[currJ-1];
            var val = num/denom;
            if (DEBUG) this.message('basicSpecificPick', [currJ,num,denom,val])
            if (val > max) { j = currJ; max = val; }
          }
          
          var e_j = Vector.Basis(this.nVars, j).subscript(this.Non);
          dxB = BinvN.multiply(e_j);
          
          this.message('basicSpecificDone', [i,j,dxB,dzN]);
        }
        else { // if max is achieved by j in Non
          j = this.muStarIndex;
          var e_j = Vector.Basis(this.nVars, j).subscript(this.Non);
          dxB = BinvN.multiply(e_j);
          
          // pick i from argmax_(i in Basic) (dx_i / (xStar_i + muStar*xBar_i))
          var max = -Infinity;
          for (var idx = 0; idx < this.nBasic; idx++) {
            var currI = this.Basic.elements[idx];
            var num = dxB.elements[idx];
            var denom = this.xStar.elements[currI-1] + 
              this.muStar * this.xBar.elements[currI-1];
            if (DEBUG) this.message('nonBasicSpecificPick', [currI,num,denom,val])
            var val = num/denom;
            if (val > max) { i = currI; max = val; }
          }
          
          var e_i = Vector.Basis(this.nVars, i).subscript(this.Basic);
          dzN = BinvN.transpose().multiply(e_i).multiply(-1);
          
          this.message('nonBasicSpecificDone', [i,j,dxB,dzN])
        }
        
        this.message('enteringLeavingChosen', {i:i, j:j})
        
        var iInBasic = this.Basic.indexOf(i);
        var jInNonbasic = this.Non.indexOf(j);
        
        // setup t, s, etc.
        var xStarI = this.xStar.elements[i-1], xBarI = this.xBar.elements[i-1],
          dxI = dxB.elements[iInBasic-1], t = xStarI/dxI, tBar = xBarI/dxI;
        var zStarJ = this.zStar.elements[j-1], zBarJ = this.zBar.elements[j-1],
          dzJ = dzN.elements[jInNonbasic-1], s = zStarJ/dzJ, sBar = zBarJ/dzJ;
        
        this.xStar.set(j, t);
        this.xBar.set(j, tBar);
        this.zStar.set(i, s);
        this.zBar.set(i, sBar);
        
        // Modify subvectors
        this.withPartitionedVectors(function(part) {
          part.xStarB = part.xStarB.subtract(dxB.multiply(t));
          part.xBarB = part.xBarB.subtract(dxB.multiply(tBar));
          part.zStarN = part.zStarN.subtract(dzN.multiply(s));
          part.zBarN = part.zBarN.subtract(dzN.multiply(sBar));
        });
        
        // Modify basis: B <- B \ {i} U {j}
        this.Basic = this.Basic.map(function(el) { return el == i ? j : el; });
        this.Non = this.Non.map(function(el) { return el == j ? i : el; });
        
        // And update the columns of B and N
        this.B = this.A.selectColumns(this.Basic);
        this.N = this.A.selectColumns(this.Non);
        
        this.message('pivotDone', this.nPivots++);
        
        // Update the values of the problem
        this.updateProblem();
        
        this.computeOptimalPerturbation();
      }
      return true;
    },
    
    updateProblem: function() {
      var data = this.problem.vars.data;
      var objective = 0;
      
      for (var idxVar = 0; idxVar < this.nNon; idxVar++) {
        var name = this.problem.vars.keys[idxVar];
        if (this.Basic.indexOf(idxVar+1)) {
          var val = data[name] = this.xStar.elements[idxVar];
          var objCoeff = this.problem.objCoeffs.data[name] || 0;
          objective += val * objCoeff;
        }
        else data[name] = 0;
      }

      this.problem.objUpdated = true;
      this.problem.objective = objective;
      
      this.message('updateProblem', [this.problem.vars.data, this.problem.objective]);
    }
  });
  
  return LPProblem;
});
