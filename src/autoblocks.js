(function() {
  var define,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (typeof define !== 'function' && module) define = require('amdefine')(module);

  define(function(require) {
    var Autoblocks;
    Autoblocks = (function() {

      function Autoblocks(options) {
        this.update = __bind(this.update, this);
        this.bind = __bind(this.bind, this);        this.binder = (options != null ? options.binder : void 0) || new Autoblocks.Binders.ObjectBinder;
        this.constrainer = (options != null ? options.constrainer : void 0) || new Autoblocks.Constrainers.TreeConstrainer;
      }

      Autoblocks.prototype.bind = function(obj) {
        return this.binder.bind(obj);
      };

      Autoblocks.prototype.update = function() {
        var problem, specs;
        specs = this.binder.specs();
        return problem = this.constrainer.problemFor(specs);
      };

      Autoblocks.Binders = require('./binders');

      Autoblocks.Constrainers = require('./constrainers');

      Autoblocks.create = function() {
        return new Autoblocks();
      };

      return Autoblocks;

    })();
    return Autoblocks;
  });

}).call(this);
