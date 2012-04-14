(function() {

  define(function(require) {
    var SortedTable, Table, utils, _, _ref;
    _ = require('underscore');
    _ref = require('./tables'), Table = _ref.Table, SortedTable = _ref.SortedTable;
    utils = {
      forConsecPairs: function(array, func) {
        for (var i = 0, l = array.length-1; i < l; ++i) func(array[i], array[i+1], i, i+1);
      },
      forAllPairs: function(array, func, orderMatters) {
        var first, i, j, second, _len, _len2, _results, _results2;
        if (orderMatters) {
          _results = [];
          for (i = 0, _len = array.length; i < _len; i++) {
            first = array[i];
            _results.push((function() {
              var _len2, _results2;
              _results2 = [];
              for (j = 0, _len2 = array.length; j < _len2; j++) {
                second = array[j];
                if (first !== second) {
                  _results2.push(func(first, second, i, j));
                } else {
                  _results2.push(void 0);
                }
              }
              return _results2;
            })());
          }
          return _results;
        } else {
          _results2 = [];
          for (i = 0, _len2 = array.length; i < _len2; i++) {
            first = array[i];
            _results2.push((function() {
              var _len3, _ref2, _results3;
              _ref2 = array.slice(i + 1);
              _results3 = [];
              for (j = 0, _len3 = _ref2.length; j < _len3; j++) {
                second = _ref2[j];
                _results3.push(func(first, second, i, i + 1 + j));
              }
              return _results3;
            })());
          }
          return _results2;
        }
      }
    };
    utils.collide = function(specs) {};
    utils.rootsFor = function(specs) {
      var allChildren, allIds, rootIds;
      allChildren = _(specs).chain().pluck('children').flatten().value();
      allIds = _(specs).pluck('id');
      rootIds = _(allIds).difference(allChildren);
      return specs.filter(function(spec) {
        return rootIds.indexOf(spec.id) >= 0;
      });
    };
    utils.tableFor = function(specs) {
      var spec, table, _i, _len;
      table = new SortedTable;
      for (_i = 0, _len = specs.length; _i < _len; _i++) {
        spec = specs[_i];
        table.put(spec.id, spec);
      }
      return table;
    };
    utils.levelsFor = function(specs) {
      var levels, recurser, root, roots, table, _i, _len;
      table = utils.tableFor(specs);
      roots = utils.rootsFor(specs);
      levels = [];
      recurser = function(spec, level) {
        var child, childId, _i, _len, _ref2, _results;
        if (level >= levels.length) {
          levels[level] = [spec];
        } else {
          levels[level].push(spec);
        }
        _ref2 = spec.children || [];
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          childId = _ref2[_i];
          child = table.get(childId);
          _results.push(recurser(child, level + 1));
        }
        return _results;
      };
      for (_i = 0, _len = roots.length; _i < _len; _i++) {
        root = roots[_i];
        recurser(root, 0);
      }
      return levels;
    };
    return utils;
  });

}).call(this);
