(function() {
  var define,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof define !== 'function' && module) define = require('amdefine')(module);

  define(function(require) {
    var $, JQueryBinder, ObjectBinder, SortedTable, Table, _, _ref;
    _ = require('underscore');
    $ = require('jquery');
    _ref = require('./tables'), Table = _ref.Table, SortedTable = _ref.SortedTable;
    ObjectBinder = (function() {

      function ObjectBinder() {
        this.onUpdates = __bind(this.onUpdates, this);
        this.specs = __bind(this.specs, this);
        this.bind = __bind(this.bind, this);        this.bound = new SortedTable;
      }

      ObjectBinder.prototype.bind = function(obj) {
        if (_.any(this.bound, function(val) {
          return val === obj;
        })) {
          return false;
        }
        this.bound.put(obj.id || _.uniqueId(), obj);
        return true;
      };

      ObjectBinder.prototype.specs = function() {
        var key, obj, res, _ref2;
        res = [];
        _ref2 = this.bound.data;
        for (key in _ref2) {
          if (!__hasProp.call(_ref2, key)) continue;
          obj = _ref2[key];
          res.push(_({}).extend(value, {
            id: key
          }));
        }
        return res;
      };

      ObjectBinder.prototype.onUpdates = function(updates) {
        var obj, update, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = updates.length; _i < _len; _i++) {
          update = updates[_i];
          obj = this.bound.get(update.id);
          _results.push(obj.centroid = update.centroid);
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

      JQueryBinder.prototype.specs = function() {
        var $e, elem, key, pos, spec, specs, _ref2;
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
          spec.centroid.x = pos.left + spec.width / 2;
          spec.centroid.y = pos.top + spec.height / 2;
          specs.push(spec);
        }
        return specs;
      };

      JQueryBinder.prototype.onUpdates = function(updates) {
        var $e, elem, height, update, width, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = updates.length; _i < _len; _i++) {
          update = updates[_i];
          elem = this.bound.get(update.id);
          $e = $(elem);
          width = $e.outerWidth();
          height = $e.outerHeight();
          _results.push($e.css({
            position: 'absolute',
            left: update.x - width / 2,
            top: update.y - width / 2
          }));
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
