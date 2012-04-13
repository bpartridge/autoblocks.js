(function() {
  var define;

  if (typeof define !== 'function' && module) define = require('amdefine')(module);

  define(function(require) {
    var LPProblem, SortedTable, SpecUtils, T, Table, TreeConstrainer, _, _ref;
    _ = require('underscore');
    LPProblem = require('./lp');
    _ref = require('./tables'), Table = _ref.Table, SortedTable = _ref.SortedTable;
    T = Table.create;
    SpecUtils = require('./specutils');
    TreeConstrainer = (function() {

      function TreeConstrainer(options) {
        this.options = _.extend({
          depthDir: 'y'
        }, options);
        this.isDepthY = this.options.depthDir === 'y';
      }

      TreeConstrainer.prototype.problemFor = function(specs) {
        var prob;
        prob = new LPProblem;
        this.processBreadth(prob, specs);
        this.processDepth(prob, specs);
        return prob;
      };

      TreeConstrainer.prototype.depthLabel = function(id) {
        if (this.isDepthY) {
          return "" + id + "_y";
        } else {
          return "" + id + "_x";
        }
      };

      TreeConstrainer.prototype.breadthLabel = function(id) {
        if (this.isDepthY) {
          return "" + id + "_x";
        } else {
          return "" + id + "_y";
        }
      };

      TreeConstrainer.prototype.depthFor = function(spec) {
        if (this.isDepthY) {
          return spec.height;
        } else {
          return spec.width;
        }
      };

      TreeConstrainer.prototype.breadthFor = function(spec) {
        if (this.isDepthY) {
          return spec.width;
        } else {
          return spec.height;
        }
      };

      TreeConstrainer.prototype.processBreadth = function(prob, specs, objCoeffs) {
        var level, levels, _i, _len, _results;
        levels = SpecUtils.levelsFor(specs);
        _results = [];
        for (_i = 0, _len = levels.length; _i < _len; _i++) {
          level = levels[_i];
          _results.push(SpecUtils.forConsecPairs(level, function(first, second, i) {
            var coeffs, constraintName, rhs;
            constraintName = "level" + level + "_constraint" + i;
            /*
                      1.centroid.y + 1.height/2 < 2.centroid.y - 2.height/2
            */
            coeffs = T(this.breadthLabel(first.id), 1, this.breadthLabel(second.id), -1);
            rhs = -this.breadthFor(first) / 2 - this.breadthFor(second) / 2;
            prob.updateConstraint(constraintName, coeffs, rhs);
            prob.objCoeffs.increment(this.breadthLabel(second.id), 1);
            return prob.objCoeffs.increment(this.breadthLabel(first.id), -1);
          }));
        }
        return _results;
      };

      TreeConstrainer.prototype.processDepth = function(prob, specs) {
        var constraintNum, recurser, root, table, _i, _len, _ref2, _results;
        table = SpecUtils.tableFor(specs);
        constraintNum = 0;
        recurser = function(parent) {
          var child, childId, coeffs, constraintName, rhs, _i, _len, _ref2, _results;
          _ref2 = parent.children || [];
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            childId = _ref2[_i];
            child = table.get(childId);
            constraintName = "children" + (constraintNum++);
            /*
                      parent.centroid.x + parent.width/2 < child.centroid.x - child.width/2
            */
            coeffs = T(this.depthLabel(parent.id), 1, this.depthLabel(childId), -1);
            rhs = -this.depthFor(parent) / 2 - this.depthFor(child) / 2;
            prob.updateConstraint(constraintName, coeffs, rhs);
            prob.objCoeffs.increment(this.depthLabel(parent.id), -1);
            prob.objCoeffs.increment(this.depthLabel(childId), 1);
            _results.push(recurser(child));
          }
          return _results;
        };
        _ref2 = SpecUtils.rootsFor(specs);
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          root = _ref2[_i];
          _results.push(recurser(root));
        }
        return _results;
      };

      return TreeConstrainer;

    })();
    return {
      TreeConstrainer: TreeConstrainer
    };
  });

}).call(this);
