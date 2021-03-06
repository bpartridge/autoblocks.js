// Based on http://blog.jcoglan.com/2010/10/18/i-am-a-fast-loop/
// Updated to use underscore, and allow method chaining
define(function(require) {
  
  _ = require('underscore');
  
  var Table = function() {
    this.keys = [];
    this.data = {};
  };
  
  // Table.create('x1', 1, 'x2', 2);
  Table.create = function() {
    var t = new Table();
    for (var i = 0; i < arguments.length-1; i+=2) {
      t.put(arguments[i], arguments[i+1]);
    }
    return t;
  }
  
  _.extend(Table.prototype, {
    put: function(key, value) {
      // TODO: use _.has instead of hasOwnProperty throughout!
      if (!this.has(key)) this.keys.push(key);
      this.data[key] = value;
      return this;
    },
    
    add: function(key, defaultValue) {
      if (!this.has(key)) {
        this.keys.push(key);
        this.data[key] = defaultValue;
      }
      return this;
    },

    increment: function(key, difference) {
      this.add(key, 0);
      this.data[key] += difference;
      return this;
    },

    get: function(key) {
      return this.data[key];
    },

    has: function(key) {
      return _(this.data).has(key);
    },

    empty: function() {
      return this.keys.length == 0;
    },
    
    forEach: function(block, context) {
      var keys = this.keys, data = this.data,
          i = keys.length, key;
      
      while (i--) {
        key = keys[i];
        block.call(context, key, data[key]);
      }
      return this;
    },
    
    mapSelf: function(block, context) {
      var keys = this.keys, data = this.data,
          i = keys.length, key;
      
      while (i--) {
        key = keys[i];
        data[key] = block.call(context, key, data[key]);
      }
      return this;
    },
  });
  
  var SortedTable = function() {
    Table.call(this);
  };
  SortedTable.prototype = new Table();
  
  _.extend(SortedTable.prototype, {
    put: function(key, value) {
      if (!this.has(key)) {
        var index = this._indexOf(key);
        this.keys.splice(index, 0, key);
      }
      this.data[key] = value;
      return this;
    },
    
    add: function(key, defaultValue) {
      if (!this.has(key)) {
        var index = this._indexOf(key);
        this.keys.splice(index, 0, key);
        this.data[key] = defaultValue;
      }
      return this;
    },
    
    remove: function(key) {
      if (!this.has(key)) return;
      delete this.data[key];
      var index = this._indexOf(key);
      this.keys.splice(index, 1);
      return this;
    },
    
    _indexOf: function(key) {
      var keys = this.keys, n = keys.length,
          i = 0, d = n;

      if (n === 0)         return 0;
      if (key < keys[0])   return 0;
      if (key > keys[n-1]) return n;

      while (key !== keys[i] && d > 0.5) {
        d = d / 2;
        i += (key > keys[i] ? 1 : -1) * Math.round(d);
        if (key > keys[i-1] && key < keys[i]) d = 0;
      }
      return i;
    }
  });
  
  return {
    Table: Table, SortedTable: SortedTable
  };
})