(function() {

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
        this.fixRoots(prob, specs);
        this.processBreadth(prob, specs);
        this.processDepth(prob, specs);
        return prob;
      };

      TreeConstrainer.prototype.updatesFrom = function(prob) {
        var updates;
        updates = {};
        prob.vars.forEach(function(key, value) {
          var full, id, match, prop, update;
          match = /^(.+)_([xy])$/.exec(key);
          if (match) {
            full = match[0], id = match[1], prop = match[2];
            update = updates[id] || (updates[id] = {
              id: id
            });
            if (update.centroid == null) update.centroid = {};
            return update.centroid[prop] = value;
          }
        });
        return _(updates).values();
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

      TreeConstrainer.prototype.fixRoots = function(prob, specs) {
        var id, root, roots, _i, _len, _ref2, _ref3, _results;
        roots = SpecUtils.rootsFor(specs);
        if (roots.length) {
          id = roots[0].id;
          if (!((_ref2 = roots[0].children) != null ? _ref2.length : void 0)) {
            this.addEqualityConstraint(prob, this.breadthLabel(id), void 0, 0);
          }
          this.addEqualityConstraint(prob, this.depthLabel(id), void 0, 0);
          if (roots.length > 1) {
            _ref3 = roots.slice(1);
            _results = [];
            for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
              root = _ref3[_i];
              _results.push(this.addEqualityConstraint(prob, this.depthLabel(root.id), void 0, 0));
            }
            return _results;
          }
        }
      };

      TreeConstrainer.prototype.processBreadth = function(prob, specs, objCoeffs) {
        var iLevel, level, levels, table, _len, _results,
          _this = this;
        table = SpecUtils.tableFor(specs);
        levels = SpecUtils.levelsFor(specs);
        _results = [];
        for (iLevel = 0, _len = levels.length; iLevel < _len; iLevel++) {
          level = levels[iLevel];
          _results.push(SpecUtils.forConsecPairs(level, function(first, second) {
            var coeffs, constraintName, recurser, rhs;
            constraintName = "level" + iLevel + "::ordering::" + first.id + "::" + second.id;
            /*
                      1.centroid.y + 1.height/2 < 2.centroid.y - 2.height/2
            */
            coeffs = T(_this.breadthLabel(first.id), 1, _this.breadthLabel(second.id), -1);
            rhs = -_this.breadthFor(first) / 2 - _this.breadthFor(second) / 2;
            prob.updateConstraint(constraintName, coeffs, rhs);
            prob.objCoeffs.increment(_this.breadthLabel(second.id), -1);
            prob.objCoeffs.increment(_this.breadthLabel(first.id), 1);
            recurser = function(source, dir, parent) {
              var child, childId, children;
              children = parent.children;
              if (children && children.length) {
                childId = dir === 1 ? _.first(children) : _.last(children);
                child = table.get(childId);
                constraintName = "nephewBreadth::" + source.id + "::" + childId;
                coeffs = T(_this.breadthLabel(source.id), dir, _this.breadthLabel(childId), -dir);
                rhs = -_this.breadthFor(source) / 2 - _this.breadthFor(child) / 2;
                prob.updateConstraint(constraintName, coeffs, rhs);
                return recurser(source, dir, child);
              }
            };
            recurser(first, 1, second);
            return recurser(second, -1, first);
          }));
        }
        return _results;
      };

      TreeConstrainer.prototype.processDepth = function(prob, specs) {
        var constraintNum, recurser, root, table, _i, _len, _ref2, _results,
          _this = this;
        table = SpecUtils.tableFor(specs);
        constraintNum = 0;
        recurser = function(parent) {
          var child, childId, children, coeffs, constrainer, constraintName, rhs, _i, _len;
          children = parent.children || [];
          for (_i = 0, _len = children.length; _i < _len; _i++) {
            childId = children[_i];
            child = table.get(childId);
            constraintName = "childDepth::" + parent.id + "::" + childId;
            /*
                      parent.centroid.x + parent.width/2 < child.centroid.x - child.width/2
            */
            coeffs = T(_this.depthLabel(parent.id), 1, _this.depthLabel(childId), -1);
            rhs = -_this.depthFor(parent) / 2 - _this.depthFor(child) / 2;
            prob.updateConstraint(constraintName, coeffs, rhs);
            prob.objCoeffs.increment(_this.depthLabel(parent.id), 1);
            prob.objCoeffs.increment(_this.depthLabel(childId), -1);
            recurser(child);
          }
          if (children.length === 1) {
            childId = children[0];
            return _this.addEqualityConstraint(prob, _this.breadthLabel(parent.id), _this.breadthLabel(childId));
          } else if (children.length >= 2) {
            constrainer = function(dir) {
              childId = dir === 1 ? _.first(children) : _.last(children);
              child = table.get(childId);
              constraintName = "parentBetweenChildren::" + parent.id + "::" + childId;
              coeffs = T(_this.breadthLabel(parent.id), -dir, _this.breadthLabel(childId), dir);
              rhs = Math.abs(_this.breadthFor(parent) - _this.breadthFor(child)) / 2;
              return prob.updateConstraint(constraintName, coeffs, rhs);
            };
            constrainer(1);
            return constrainer(-1);
          }
        };
        _ref2 = SpecUtils.rootsFor(specs);
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          root = _ref2[_i];
          _results.push(recurser(root));
        }
        return _results;
      };

      TreeConstrainer.prototype.addEqualityConstraint = function(prob, label0, label1, value) {
        var coeffs, mult, name, suffix, _i, _len, _ref2, _ref3, _results;
        if (value == null) value = 0;
        _ref2 = [[1, 'Pos'], [-1, 'Neg']];
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          _ref3 = _ref2[_i], mult = _ref3[0], suffix = _ref3[1];
          name = "equality::" + label0 + "::" + (label1 || 'value::' + value) + "::" + suffix;
          coeffs = T(label0, mult);
          if (label1 != null) coeffs.put(label1, mult * -1);
          _results.push(prob.updateConstraint(name, coeffs, mult * value));
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
