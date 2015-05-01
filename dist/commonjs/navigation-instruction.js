'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

exports.__esModule = true;

var _core = require('core-js');

var _core2 = _interopRequireDefault(_core);

var NavigationInstruction = (function () {
  function NavigationInstruction(fragment, queryString, params, queryParams, config, parentInstruction) {
    _classCallCheck(this, NavigationInstruction);

    var allParams = Object.assign({}, queryParams, params);

    this.fragment = fragment;
    this.queryString = queryString;
    this.params = params || {};
    this.queryParams = queryParams;
    this.config = config;
    this.lifecycleArgs = [allParams, config, this];
    this.viewPortInstructions = {};

    if (parentInstruction) {
      this.params.$parent = parentInstruction.params;
    }
  }

  NavigationInstruction.prototype.addViewPortInstruction = function addViewPortInstruction(viewPortName, strategy, moduleId, component) {
    return this.viewPortInstructions[viewPortName] = {
      name: viewPortName,
      strategy: strategy,
      moduleId: moduleId,
      component: component,
      childRouter: component.childRouter,
      lifecycleArgs: this.lifecycleArgs.slice()
    };
  };

  NavigationInstruction.prototype.getWildCardName = function getWildCardName() {
    var wildcardIndex = this.config.route.lastIndexOf('*');
    return this.config.route.substr(wildcardIndex + 1);
  };

  NavigationInstruction.prototype.getWildcardPath = function getWildcardPath() {
    var wildcardName = this.getWildCardName(),
        path = this.params[wildcardName];

    if (this.queryString) {
      path += '?' + this.queryString;
    }

    return path;
  };

  NavigationInstruction.prototype.getBaseUrl = function getBaseUrl() {
    if (!this.params) {
      return this.fragment;
    }

    var wildcardName = this.getWildCardName(),
        path = this.params[wildcardName];

    if (!path) {
      return this.fragment;
    }

    return this.fragment.substr(0, this.fragment.lastIndexOf(path));
  };

  return NavigationInstruction;
})();

exports.NavigationInstruction = NavigationInstruction;