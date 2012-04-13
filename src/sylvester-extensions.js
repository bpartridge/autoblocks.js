if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require) {

  var Sylvester = require('./sylvester'),
    Matrix = Sylvester.Matrix,
    Vector = Sylvester.Vector,
    _ = require('underscore');

  _.extend(Vector.prototype, {
    // Return a new Vector of the same length as the argument,
    // whose elements are the elements of this vector at the
    // indices specified as the elements of the argument;
    // similar to MATLAB's operator
    subscript: function(indices) {
      var indEls = indices.elements || indices;
      var elements = [];
      for (var i = 0; i < indEls.length; i++) {
        var element = this.elements[indEls[i]-1];
        elements.push(element);
      }
      return Vector.create(elements);
    },
    
    setSubscript: function(indices, values) {
      var _indices = indices.elements || indices;
      var _values = values.elements || values;
      var n = _indices.length;
      for (var i = 0; i < n; i++) {
        var index = _indices[i];
        var value = _values[i];
        this.elements[index-1] = value;
      }
    },
    
    set: function(index, value) {
      this.elements[index-1] = value;
    }
  });

  // Basis vector, with one nonzero value equal to 1 at the subscript
  Vector.Basis = function(n, subscript) {
    var elements = [];
    for (var i = 0; i < n; i++) { 
      elements.push(i+1 == subscript ? 1 : 0);
    }
    return Vector.create(elements);
  }

  _.extend(Matrix.prototype, {
    // Creates a new matrix with certain (ones-indexed) columns from this
    selectColumns: function(colIndices) {
      var cols = colIndices.elements || colIndices;
      var els = [], nRows = this.elements.length, 
        nCols = cols.length, i, j;
      for (i = 0; i < nRows; i++) {
        els[i] = [];
        for (j = 0; j < nCols; j++) {
          els[i][j] = this.elements[i][cols[j]-1];
        }
      }
      return Matrix.create(els);
    }
  });

});