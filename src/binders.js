(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(function(require) {
    var $, JQueryBinder, ObjectBinder, SortedTable, Table, _, _ref;
    _ = require('underscore');
    $ = require('jquery');
    _ref = require('./tables'), Table = _ref.Table, SortedTable = _ref.SortedTable;
    ObjectBinder = (function() {

      function ObjectBinder(options) {
        this.onUpdates = __bind(this.onUpdates, this);
        this.specs = __bind(this.specs, this);
        this.bind = __bind(this.bind, this);        this.options = _.extend(this.defaults, options);
        this.bound = new SortedTable;
      }

      ObjectBinder.prototype.defaults = {};

      ObjectBinder.prototype.bind = function(obj) {
        var arr, item, _i, _len, _results;
        arr = _.isArray(obj) ? obj : [obj];
        _results = [];
        for (_i = 0, _len = arr.length; _i < _len; _i++) {
          item = arr[_i];
          if (!_.any(this.bound, function(val) {
            return val === item;
          })) {
            _results.push(this.bound.put(item.id || _.uniqueId(), item));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      ObjectBinder.prototype.specs = function() {
        var key, res, value, _ref2;
        res = [];
        _ref2 = this.bound.data;
        for (key in _ref2) {
          if (!__hasProp.call(_ref2, key)) continue;
          value = _ref2[key];
          res.push(_({}).extend(value, {
            id: key
          }));
        }
        return res;
      };

      ObjectBinder.prototype.onUpdates = function(updates) {
        var obj, update, _i, _len, _ref2, _results;
        _results = [];
        for (_i = 0, _len = updates.length; _i < _len; _i++) {
          update = updates[_i];
          obj = this.bound.get(update.id);
          _results.push(_.extend((_ref2 = obj.centroid) != null ? _ref2 : obj.centroid = {}, update.centroid));
        }
        return _results;
      };

      return ObjectBinder;

    })();
    JQueryBinder = (function(_super) {

      __extends(JQueryBinder, _super);

      function JQueryBinder() {
        this.onUpdates = __bind(this.onUpdates, this);
        this.specs = __bind(this.specs, this);
        JQueryBinder.__super__.constructor.apply(this, arguments);
      }

      JQueryBinder.prototype.defaults = {
        abClass: 'ab-block',
        idClassPrefix: 'ab-id-',
        childClassPrefix: 'ab-child-'
      };

      JQueryBinder.prototype.specs = function() {
        var $e, c, childId, elem, key, pos, spec, specs, _i, _len, _ref2, _ref3;
        specs = [];
        _ref2 = this.bound.data;
        for (key in _ref2) {
          if (!__hasProp.call(_ref2, key)) continue;
          elem = _ref2[key];
          $e = $(elem);
          pos = $e.position();
          spec = {
            id: key,
            width: $e.outerWidth(),
            height: $e.outerHeight(),
            centroid: {}
          };
          _ref3 = $e.attr('class').split(/\s+/);
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            c = _ref3[_i];
            if (c.indexOf(this.options.childClassPrefix === 0)) {
              childId = c.substring(this.options.childClassPrefix.length);
              spec.children || (spec.children = []);
              spec.children.push(childId);
            }
          }
          spec.centroid.x = pos.left + spec.width / 2;
          spec.centroid.y = pos.top + spec.height / 2;
          specs.push(spec);
        }
        return specs;
      };

      JQueryBinder.prototype.onUpdates = function(updates) {
        var $e, elem, height, update, width, x, y, _i, _len, _ref2, _ref3, _results;
        _results = [];
        for (_i = 0, _len = updates.length; _i < _len; _i++) {
          update = updates[_i];
          elem = this.bound.get(update.id);
          $e = $(elem);
          width = $e.outerWidth();
          height = $e.outerHeight();
          if ((x = (_ref2 = update.centroid) != null ? _ref2.x : void 0) != null) {
            $e.css({
              left: x - width / 2
            });
          }
          if ((y = (_ref3 = update.centroid) != null ? _ref3.y : void 0) != null) {
            _results.push($e.css({
              top: y - height / 2
            }));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      return JQueryBinder;

    })(ObjectBinder);
    return {
      ObjectBinder: ObjectBinder,
      JQueryBinder: JQueryBinder
    };
  });

}).call(this);
