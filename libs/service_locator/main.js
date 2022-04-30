var Implementation = function (constructor, args) {
  this.constructor = constructor;
  this.args = args;
};

var Definition = function (name, constructor, args, lifestyle) {
  this.name = name;
  this.value = new Implementation(constructor, args);
  this.dependencies = [];
  this.lifestyle = lifestyle || 'singleton';
  this.instance = null;
};

var ServiceLocator = module.exports = function () {
  this.entries = {};
  this.dependents = {};
};

ServiceLocator.prototype.register = function (name, constructor, args, lifestyle) {
  var definition = new Definition(name, constructor, args, lifestyle);
  args = args || [];

  var self = this;
  args.forEach(function (arg) {
    if (typeof arg === 'object' && arg['$type'] &&
      arg['$type'] === 'component') {
      var $name = arg['$name'];
      definition.dependencies.push($name);
      if (!self.dependents[$name]) {
        self.dependents[$name] = [];
      }
      self.dependents[$name].push(definition.name);
    }
  });

  this.evict(name);
  this.entries[name] = definition;
};

ServiceLocator.prototype.evict = function (name) {
  var self = this;
  if (self.dependents[name]) {
    self.dependents[name].forEach(function (dep) {
      self.entries[dep].instance = null;
      self.evict(dep);
    });
  }
};

ServiceLocator.prototype.resolve = function (name) {
  var definition = this.entries[name];

  if (!definition) {
    var message = 'No definition for `' + name + '` exists.';
    throw new Error(message);
  }

  var obj;

  if (definition.instance) {
    if (typeof definition.instance === 'function') {
      obj = definition.instance();
    } else if (typeof definition.instance === 'object') {
      obj = definition.instance;
    }
  } else {
    var value = definition.value;
    var constructor = value.constructor;
    var tempArgs = value.args || [];
    var args = [];

    var self = this;
    tempArgs.forEach(function (arg) {
      if (typeof arg === 'object' && arg['$type']) {
        var type = arg['$type'];
        if (type === 'component') {
          arg = self.resolve(arg['$name']);
          definition.dependencies.push(arg['$name']);
        } else if (type === 'dynamic') {
          arg = arg['$fn']();
        }
      }
      args.push(arg);
    });

    if (typeof constructor === 'function') {
      obj = Object.create(constructor.prototype);
      obj.constructor.apply(obj, args);

      if (!Object.keys(constructor.prototype).length &&
        !Object.keys(obj).length) {
        // non-constructor function
        // bind args to function for entry instance
        var boundArgs = [constructor].concat(args);
        if (definition.lifestyle === 'singleton') {
          definition.instance = constructor.bind.apply(constructor, boundArgs);
        }
      } else {
        if (definition.lifestyle === 'singleton') {
          definition.instance = obj;
        }
      }
    } else if (typeof constructor === 'object') {
      obj = constructor;
      if (definition.lifestyle === 'singleton') {
        definition.instance = obj;
      }
    }
  }

  return obj;
};

ServiceLocator.prototype.component = function (name) {
  return {
    $type: 'component',
    $name: name
  };
};

ServiceLocator.prototype.dynamic = function (fn) {
  return {
    $type: 'dynamic',
    $fn: fn
  };
};