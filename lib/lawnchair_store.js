(function() {
  var Lawnchair;

  Lawnchair = require('./vendor/lawnchair');

  module.exports = {
    prepareStore: function(name, callback) {
      var model;
      if (this._lawnchairStore != null) return callback(this._lawnchairStore);
      model = this;
      return new Lawnchair({
        name: name
      }, function() {
        model._lawnchairStore = this;
        return callback(this);
      });
    }
  };

}).call(this);
