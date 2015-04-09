define(['exports', './route-filters'], function (exports, _routeFilters) {
  'use strict';

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  var RouterConfiguration = (function () {
    function RouterConfiguration() {
      _classCallCheck(this, RouterConfiguration);

      this.instructions = [];
      this.options = {};
      this.pipelineSteps = [];
    }

    _createClass(RouterConfiguration, [{
      key: 'addPipelineStep',
      value: function addPipelineStep(name, step) {
        this.pipelineSteps.push({ name: name, step: step });
      }
    }, {
      key: 'map',
      value: function map(route, config) {
        if (Array.isArray(route)) {
          for (var i = 0; i < route.length; i++) {
            this.map(route[i]);
          }

          return this;
        }

        if (typeof route == 'string') {
          if (!config) {
            config = {};
          } else if (typeof config == 'string') {
            config = { moduleId: config };
          }

          config.route = route;
        } else {
          config = route;
        }

        return this.mapRoute(config);
      }
    }, {
      key: 'mapRoute',
      value: function mapRoute(config) {
        var _this = this;

        this.instructions.push(function (router) {
          if (Array.isArray(config.route)) {
            var navModel = {},
                i,
                ii,
                current;

            for (i = 0, ii = config.route.length; i < ii; ++i) {
              current = Object.assign({}, config);
              current.route = config.route[i];
              _this.configureRoute(router, current, navModel);
            }
          } else {
            _this.configureRoute(router, Object.assign({}, config));
          }
        });

        return this;
      }
    }, {
      key: 'mapUnknownRoutes',
      value: function mapUnknownRoutes(config) {
        this.unknownRouteConfig = config;
        return this;
      }
    }, {
      key: 'exportToRouter',
      value: function exportToRouter(router) {
        var instructions = this.instructions,
            pipelineSteps = this.pipelineSteps,
            i,
            ii,
            filterContainer;

        for (i = 0, ii = instructions.length; i < ii; ++i) {
          instructions[i](router);
        }

        if (this.title) {
          router.title = this.title;
        }

        if (this.unknownRouteConfig) {
          router.handleUnknownRoutes(this.unknownRouteConfig);
        }

        router.options = this.options;

        if (pipelineSteps.length) {
          if (!router.isRoot) {
            throw new Error('Pipeline steps can only be added to the root router');
          }

          filterContainer = router.container.get(_routeFilters.RouteFilterContainer);
          for (i = 0, ii = pipelineSteps.length; i < ii; ++i) {
            var _pipelineSteps$i = pipelineSteps[i];
            var name = _pipelineSteps$i.name;
            var step = _pipelineSteps$i.step;

            filterContainer.addStep(name, step);
          }
        }
      }
    }, {
      key: 'configureRoute',
      value: function configureRoute(router, config, navModel) {
        this.ensureDefaultsForRouteConfig(config);
        router.addRoute(config, navModel);
      }
    }, {
      key: 'ensureDefaultsForRouteConfig',
      value: function ensureDefaultsForRouteConfig(config) {
        config.name = ensureConfigValue(config, 'name', this.deriveName);
        config.route = ensureConfigValue(config, 'route', this.deriveRoute);
        config.title = ensureConfigValue(config, 'title', this.deriveTitle);
        config.moduleId = ensureConfigValue(config, 'moduleId', this.deriveModuleId);
      }
    }, {
      key: 'deriveName',
      value: function deriveName(config) {
        return config.title || (config.route ? stripParametersFromRoute(config.route) : config.moduleId);
      }
    }, {
      key: 'deriveRoute',
      value: function deriveRoute(config) {
        return config.moduleId || config.name;
      }
    }, {
      key: 'deriveTitle',
      value: function deriveTitle(config) {
        var value = config.name;
        return value ? value.substr(0, 1).toUpperCase() + value.substr(1) : null;
      }
    }, {
      key: 'deriveModuleId',
      value: function deriveModuleId(config) {
        return stripParametersFromRoute(config.route);
      }
    }]);

    return RouterConfiguration;
  })();

  exports.RouterConfiguration = RouterConfiguration;

  function ensureConfigValue(config, property, getter) {
    var value = config[property];

    if (value || value === '') {
      return value;
    }

    return getter(config);
  }

  function stripParametersFromRoute(route) {
    var colonIndex = route.indexOf(':');
    var length = colonIndex > 0 ? colonIndex - 1 : route.length;
    return route.substr(0, length);
  }
});