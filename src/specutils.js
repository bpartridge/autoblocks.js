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
    utils.pickRandom = function(array, count, randomObj) {
      var i;
      if (count == null) count = 1;
      if (typeof randomOb === "undefined" || randomOb === null) randomOb = Math;
      return (function() {
        var _results;
        _results = [];
        for (i = 1; 1 <= count ? i <= count : i >= count; 1 <= count ? i++ : i--) {
          _results.push(array[Math.floor(randomObj.random() * array.length)]);
        }
        return _results;
      })();
    };
    utils.collide = function(specs) {
      var pairs;
      pairs = [];
      utils.forAllPairs(specs, function(first, second) {
        return pairs.push([first, second]);
      });
      return _(pairs).find(function(pair) {
        var dx, dy, first, second;
        first = pair[0], second = pair[1];
        dx = Math.abs(first.centroid.x - second.centroid.x);
        dy = Math.abs(first.centroid.y - second.centroid.y);
        return dx < (first.width + second.width) / 2 && dy < (first.height + second.height) / 2;
      });
    };
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
    utils.boundsFor = function(specs) {
      var dims;
      dims = {};
      dims.minX = _.min(_(specs).map(function(spec) {
        return spec.centroid.x - spec.width / 2;
      }));
      dims.maxX = _.max(_(specs).map(function(spec) {
        return spec.centroid.x + spec.width / 2;
      }));
      dims.minY = _.min(_(specs).map(function(spec) {
        return spec.centroid.y - spec.height / 2;
      }));
      dims.maxY = _.max(_(specs).map(function(spec) {
        return spec.centroid.y + spec.height / 2;
      }));
      dims.width = dims.maxX - dims.minX;
      dims.height = dims.maxY - dims.minY;
      return dims;
    };
    utils.specContains = function(spec, point) {
      var dx, dy;
      dx = Math.abs(point.x - spec.centroid.x);
      dy = Math.abs(point.y - spec.centroid.y);
      return dx < spec.width / 2 && dy < spec.height / 2;
    };
    utils.drawToString = function(specs, cols) {
      var BG, CLEAR, COLS_PER_ROW, c, colorForId, contained, dims, ids, letterForId, pt, r, rc2xy, rcOverXY, rows, spec, strings, termColors, _i, _len, _ref2, _ref3;
      if (!specs.length) return "";
      COLS_PER_ROW = 5;
      dims = utils.boundsFor(specs);
      dims.width += 1;
      dims.height += 1;
      rcOverXY = cols / dims.width;
      rows = Math.ceil(rcOverXY * dims.height / COLS_PER_ROW);
      rc2xy = function(r, c) {
        var x, y;
        x = c / rcOverXY + dims.minX;
        y = r * COLS_PER_ROW / rcOverXY + dims.minY;
        return {
          x: x,
          y: y
        };
      };
      ids = _(specs).pluck('id');
      termColors = _.flatten(_([31, 32, 33, 34, 35, 36, 37]).map(function(i) {
        return ["\033[" + i + "m"];
      }));
      colorForId = function(id) {
        var idx;
        idx = _(ids).indexOf(id);
        if (idx >= termColors.length) idx = 0;
        return termColors[idx];
      };
      letterForId = function(id) {
        var idx, letter;
        idx = _(ids).indexOf(id);
        return letter = String.fromCharCode(65 + idx || 40);
      };
      CLEAR = '\033[m';
      BG = '\033[1;47m';
      strings = [];
      for (_i = 0, _len = specs.length; _i < _len; _i++) {
        spec = specs[_i];
        strings.push(colorForId(spec.id));
        strings.push(spec.id);
        if (spec.children) strings.push(CLEAR + "->");
        strings.push(_(spec.children || []).map(function(childId) {
          return colorForId(childId) + childId + CLEAR;
        }).join(','));
        strings.push(CLEAR + '  ');
      }
      strings.push(CLEAR + '\n');
      for (r = 0, _ref2 = rows - 1; 0 <= _ref2 ? r <= _ref2 : r >= _ref2; 0 <= _ref2 ? r++ : r--) {
        for (c = 0, _ref3 = cols - 1; 0 <= _ref3 ? c <= _ref3 : c >= _ref3; 0 <= _ref3 ? c++ : c--) {
          pt = rc2xy(r, c);
          contained = _(specs).filter(function(spec) {
            return utils.specContains(spec, pt);
          });
          if (contained.length > 0) {
            if (contained.length > 1) strings.push(BG);
            strings.push(colorForId(contained[0].id));
            strings.push(letterForId(contained[0].id));
            if (contained.length > 1) strings.push(CLEAR);
          } else {
            strings.push(' ');
          }
        }
        strings.push(CLEAR + '\n');
      }
      return strings.join('');
    };
    return utils;
  });

}).call(this);
