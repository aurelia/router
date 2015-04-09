"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var NavigationInstruction = (function () {
  function NavigationInstruction(fragment, queryString, params, queryParams, config, parentInstruction) {
    _classCallCheck(this, NavigationInstruction);

    this.fragment = fragment;
    this.queryString = queryString;
    this.params = params || {};
    this.queryParams = queryParams;
    this.config = config;
    this.lifecycleArgs = [params, queryParams, config, this];
    this.viewPortInstructions = {};

    if (parentInstruction) {
      this.params.$parent = parentInstruction.params;
    }
  }

  _createClass(NavigationInstruction, [{
    key: "addViewPortInstruction",
    value: function addViewPortInstruction(viewPortName, strategy, moduleId, component) {
      return this.viewPortInstructions[viewPortName] = {
        name: viewPortName,
        strategy: strategy,
        moduleId: moduleId,
        component: component,
        childRouter: component.executionContext.router,
        lifecycleArgs: this.lifecycleArgs.slice()
      };
    }
  }, {
    key: "getWildCardName",
    value: function getWildCardName() {
      var wildcardIndex = this.config.route.lastIndexOf("*");
      return this.config.route.substr(wildcardIndex + 1);
    }
  }, {
    key: "getWildcardPath",
    value: function getWildcardPath() {
      var wildcardName = this.getWildCardName(),
          path = this.params[wildcardName];

      if (this.queryString) {
        path += "?" + this.queryString;
      }

      return path;
    }
  }, {
    key: "getBaseUrl",
    value: function getBaseUrl() {
      if (!this.params) {
        return this.fragment;
      }

      var wildcardName = this.getWildCardName(),
          path = this.params[wildcardName];

      if (!path) {
        return this.fragment;
      }

      return this.fragment.substr(0, this.fragment.lastIndexOf(path));
    }
  }]);

  return NavigationInstruction;
})();

exports.NavigationInstruction = NavigationInstruction;