System.register(['aurelia-dependency-injection'], function (_export) {
  var Container, _toConsumableArray, _classCallCheck, _createClass, RouteFilterContainer, RouteFilterStep;

  _export('createRouteFilterStep', createRouteFilterStep);

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
      'use strict';

      _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      RouteFilterContainer = (function () {
        function RouteFilterContainer(container) {
          _classCallCheck(this, RouteFilterContainer);

          this.container = container;
          this.filters = {};
          this.filterCache = {};
        }

        _createClass(RouteFilterContainer, [{
          key: 'addStep',
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
          }
        }, {
          key: 'getFilterSteps',
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
              if (typeof filter[i] === 'string') {
                steps.push.apply(steps, _toConsumableArray(this.getFilterSteps(filter[i])));
              } else {
                steps.push(this.container.get(filter[i]));
              }
            }

            return this.filterCache[name] = steps;
          }
        }], [{
          key: 'inject',
          value: function inject() {
            return [Container];
          }
        }]);

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

        _createClass(RouteFilterStep, [{
          key: 'getSteps',
          value: function getSteps() {
            return this.routeFilterContainer.getFilterSteps(this.name);
          }
        }]);

        return RouteFilterStep;
      })();
    }
  };
});