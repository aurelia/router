define(["exports"], function (exports) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var NavigationInstruction = exports.NavigationInstruction = (function () {
    function NavigationInstruction(fragment, queryString, params, queryParams, config, parentInstruction) {
      this.fragment = fragment;
      this.queryString = queryString;
      this.params = params || {};
      this.queryParams = queryParams;
      this.config = config;
      this.lifecycleArgs = [params, queryParams, config];
      this.viewPortInstructions = {};

      if (parentInstruction) {
        this.params.$parent = parentInstruction.params;
      }
    }

    _prototypeProperties(NavigationInstruction, null, {
      addViewPortInstruction: {
        value: function addViewPortInstruction(viewPortName, strategy, moduleId, component) {
          return this.viewPortInstructions[viewPortName] = {
            name: viewPortName,
            strategy: strategy,
            moduleId: moduleId,
            component: component,
            childRouter: component.executionContext.router,
            lifecycleArgs: this.lifecycleArgs.slice()
          };
        },
        writable: true,
        configurable: true
      },
      getWildCardName: {
        value: function getWildCardName() {
          var wildcardIndex = this.config.route.lastIndexOf("*");
          return this.config.route.substr(wildcardIndex + 1);
        },
        writable: true,
        configurable: true
      },
      getWildcardPath: {
        value: function getWildcardPath() {
          var wildcardName = this.getWildCardName(),
              path = this.params[wildcardName];

          if (this.queryString) {
            path += "?" + this.queryString;
          }

          return path;
        },
        writable: true,
        configurable: true
      },
      getBaseUrl: {
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
        },
        writable: true,
        configurable: true
      }
    });

    return NavigationInstruction;
  })();
  exports.__esModule = true;
});