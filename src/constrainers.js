(function() {
  var define;

  if (typeof define !== 'function' && module) define = require('amdefine')(module);

  define(function(require) {
    var Constrainer, TreeConstrainer;
    Constrainer = (function() {

      function Constrainer() {}

      return Constrainer;

    })();
    TreeConstrainer = (function() {

      function TreeConstrainer() {}

      return TreeConstrainer;

    })();
    return {
      TreeConstrainer: TreeConstrainer
    };
  });

}).call(this);
