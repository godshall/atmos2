(function() {
  var AppContext;

  String.prototype.underscorize = function() {
    return this.replace(/([A-Z])/g, function(letter) {
      return ("_" + (letter.toLowerCase())).substr(1);
    });
  };

  AppContext = (function() {

    function AppContext() {
      this._models = {};
    }

    AppContext.prototype.exists = function(uri) {
      var model;
      model = this._modelForURI(uri);
      return !!model.exists(uri.id);
    };

    AppContext.prototype.updateOrCreate = function(uri, data) {
      if (this.exists(uri)) {
        return this.update(uri, data);
      } else {
        return this.create(uri, data);
      }
    };

    AppContext.prototype.create = function(uri, data) {
      var model, record;
      model = this._modelForURI(uri);
      record = new model(data);
      if (uri.id != null) record.id = uri.id;
      record.save();
      uri.id = record.id;
      model.fetch();
      return record;
    };

    AppContext.prototype.update = function(uri, data) {
      var record;
      record = this.objectAtURI(uri);
      record.updateAttributes(data);
      return record;
    };

    AppContext.prototype.changeID = function(uri, id) {
      var record;
      record = this.objectAtURI(uri);
      console.log("changing id from " + record.id + " to " + id);
      return record.changeID(id);
    };

    AppContext.prototype.relation = function(name, sourceURI, targetURI) {
      var hash, source, target;
      source = this.objectAtURI(sourceURI);
      target = this.objectAtURI(targetURI);
      hash = {};
      hash[name] = target;
      source.updateAttributes(hash);
      return source.save();
    };

    AppContext.prototype.objectAtURI = function(uri) {
      var model;
      model = this._modelForURI(uri);
      return model.find(uri.id);
    };

    AppContext.prototype.dataForURI = function(uri) {
      return this.dataForObject(this.objectAtURI(uri));
    };

    AppContext.prototype.dataForObject = function(object) {
      return object.attributes();
    };

    AppContext.prototype._modelForURI = function(uri) {
      var model;
      model = this._models[uri.collection];
      if (!model) {
        console.log("Initializing model", uri.collection);
        model = require("models/" + (uri.collection.underscorize()));
        model.fetch();
        this._models[uri.collection] = model;
      }
      return model;
    };

    AppContext.prototype.objectURI = function(object) {
      return {
        collection: object.constructor.className,
        id: object.id
      };
    };

    AppContext.prototype.allURIs = function(collection, predicate) {
      var model, object, objects, uri, _i, _len, _results;
      uri = {
        collection: collection
      };
      model = this._modelForURI(uri);
      objects = predicate != null ? model.select(predicate) : model.all();
      _results = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        _results.push(this.objectURI(object));
      }
      return _results;
    };

    AppContext.prototype.destroy = function(uri) {
      return this.objectAtURI(uri).destroy();
    };

    return AppContext;

  })();

  module.exports = AppContext;

}).call(this);
