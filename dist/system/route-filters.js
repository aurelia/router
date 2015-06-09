System.register(['aurelia-dependency-injection'], function (_export) {
  'use strict';

  var Container, RouteFilterContainer, RouteFilterStep;

  _export('createRouteFilterStep', createRouteFilterStep);

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

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
      RouteFilterContainer = (function () {
        function RouteFilterContainer(container) {
          _classCallCheck(this, RouteFilterContainer);

          this.container = container;
          this.filters = {};
          this.filterCache = {};
        }

        RouteFilterContainer.inject = function inject() {
          return [Container];
        };

        RouteFilterContainer.prototype.addStep = function addStep(name, step) {
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
        };

        RouteFilterContainer.prototype.getFilterSteps = function getFilterSteps(name) {
          if (this.filterCache[name]) {
            return this.filterCache[name];
          }

          var steps = [];
          var filter = this.filters[name];
          if (!filter) {
            return steps;
          }

          for (var i = 0, l = filter.length; i < l; i++) {
            if (typeof filter[i] === 'string') {
              steps.push.apply(steps, this.getFilterSteps(filter[i]));
            } else {
              steps.push(this.container.get(filter[i]));
            }
          }

          return this.filterCache[name] = steps;
        };

        return RouteFilterContainer;
      })();

      _export('RouteFilterContainer', RouteFilterContainer);

      RouteFilterStep = (function () {
        function RouteFilterStep(name, routeFilterContainer) {
          _classCallCheck(this, RouteFilterStep);

          this.name = name;
          this.routeFilterContainer = routeFilterContainer;
          this.isMultiStep = true;
        }

        RouteFilterStep.prototype.getSteps = function getSteps() {
          return this.routeFilterContainer.getFilterSteps(this.name);
        };

        return RouteFilterStep;
      })();
    }
  };
});