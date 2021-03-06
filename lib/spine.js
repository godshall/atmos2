(function() {
  var Atmosphere, Spine,
    __slice = Array.prototype.slice;

  Spine = require('spine');

  Atmosphere = require('./synchronizer');

  require('./lawnchair_spine');

  Spine.Model.Atmosphere = {
    extended: function() {
      var spineSave;
      this.extend(Spine.Model.Lawnchair);
      spineSave = this.prototype["save"];
      this.prototype["save"] = function() {
        var args, atmos, options;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        atmos = Atmosphere.instance;
        options = args[0];
        if ((atmos != null) && (options != null) && options.remote === true) {
          return atmos.save(this, options);
        } else {
          return spineSave.call.apply(spineSave, [this].concat(__slice.call(args)));
        }
      };
      this.prototype["changeID"] = function(id) {
        this.destroy();
        this.id = id;
        this.newRecord = true;
        return this.save();
      };
      return this.bind('beforeCreate', function(record) {
        return record.id || (record.id = this._uuid());
      });
    },
    _uuid: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r, v;
        r = Math.random() * 16 | 0;
        v = c === 'x' ? r : r & 3 | 8;
        return v.toString(16);
      });
    },
    sync: function(params) {
      var atmos;
      if (params == null) params = {};
      this.fetch();
      atmos = Atmosphere.instance;
      if ((atmos != null) && params.remote === true) {
        return atmos.fetch(this, params);
      }
    }
  };

}).call(this);
