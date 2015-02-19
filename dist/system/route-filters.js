System.register(["aurelia-dependency-injection"], function (_export) {
  "use strict";

  var Container, _toArray, _prototypeProperties, RouteFilterContainer, RouteFilterStep;
  _export("createRouteFilterStep", createRouteFilterStep);

  function createRouteFilterStep(name) {
    function create(routeFilterContainer) {
      return new RouteFilterStep(name, routeFilterContainer);
    };
    create.inject = function () {
      return [RouteFilterContainer];
    };
    return create;
  }

  return {
    setters: [function (_aureliaDependencyInjection) {
      Container = _aureliaDependencyInjection.Container;
    }],
    execute: function () {
      _toArray = function (arr) { return Array.isArray(arr) ? arr : Array.from(arr); };

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      RouteFilterContainer = _export("RouteFilterContainer", (function () {
        function RouteFilterContainer(container) {
          this.container = container;
          this.filters = {};
          this.filterCache = {};
        }

        _prototypeProperties(RouteFilterContainer, {
          inject: {
            value: function inject() {
              return [Container];
            },
            writable: true,
            configurable: true
          }
        }, {
          addStep: {
            value: function addStep(name, step) {
              var index = arguments[2] === undefined ? -1 : arguments[2];
              var filter = this.filters[name];
              if (!filter) {
                filter = this.filters[name] = [];
              }

              if (index === -1) {
                index = filter.length;
              }

              filter.splice(index, 0, step);
              this.filterCache = {};
            },
            writable: true,
            configurable: true
          },
          getFilterSteps: {
            value: function getFilterSteps(name) {
              if (this.filterCache[name]) {
                return this.filterCache[name];
              }

              var steps = [];
              var filter = this.filters[name];
              if (!filter) {
                return steps;
              }

              for (var i = 0, l = filter.length; i < l; i++) {
                if (typeof filter[i] === "string") {
                  steps.push.apply(steps, _toArray(this.getFilterSteps(filter[i])));
                } else {
                  steps.push(this.container.get(filter[i]));
                }
              }

              return this.filterCache[name] = steps;
            },
            writable: true,
            configurable: true
          }
        });

        return RouteFilterContainer;
      })());
      RouteFilterStep = (function () {
        function RouteFilterStep(name, routeFilterContainer) {
          this.name = name;
          this.routeFilterContainer = routeFilterContainer;
          this.isMultiStep = true;
        }

        _prototypeProperties(RouteFilterStep, null, {
          getSteps: {
            value: function getSteps() {
              return this.routeFilterContainer.getFilterSteps(this.name);
            },
            writable: true,
            configurable: true
          }
        });

        return RouteFilterStep;
      })();
    }
  };
});