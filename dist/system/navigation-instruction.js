System.register(['core-js'], function (_export) {
  'use strict';

  var core, NavigationInstruction;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_coreJs) {
      core = _coreJs['default'];
    }],
    execute: function () {
      NavigationInstruction = (function () {
        function NavigationInstruction(fragment, queryString, params, queryParams, config, parentInstruction) {
          _classCallCheck(this, NavigationInstruction);

          this.fragment = fragment;
          this.queryString = queryString;
          this.params = params || {};
          this.queryParams = queryParams;
          this.config = config;
          this.viewPortInstructions = {};
          this.parentInstruction = parentInstruction;

          var ancestorParams = [];
          var current = this;
          do {
            var currentParams = Object.assign({}, current.params);
            if (current.config.hasChildRouter) {
              delete currentParams[current.getWildCardName()];
            }

            ancestorParams.unshift(currentParams);
            current = current.parentInstruction;
          } while (current);

          var allParams = Object.assign.apply(Object, [{}, queryParams].concat(ancestorParams));
          this.lifecycleArgs = [allParams, config, this];
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
          var wildcardName = this.getWildCardName();
          var path = this.params[wildcardName] || '';

          if (this.queryString) {
            path += '?' + this.queryString;
          }

          return path;
        };

        NavigationInstruction.prototype.getBaseUrl = function getBaseUrl() {
          if (!this.params) {
            return this.fragment;
          }

          var wildcardName = this.getWildCardName();
          var path = this.params[wildcardName] || '';

          if (!path) {
            return this.fragment;
          }

          return this.fragment.substr(0, this.fragment.lastIndexOf(path));
        };

        return NavigationInstruction;
      })();

      _export('NavigationInstruction', NavigationInstruction);
    }
  };
});