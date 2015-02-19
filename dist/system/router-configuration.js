System.register(["./route-filters"], function (_export) {
  "use strict";

  var RouteFilterContainer, _prototypeProperties, RouterConfiguration;


  function ensureConfigValue(config, property, getter) {
    var value = config[property];

    if (value || value === "") {
      return value;
    }

    return getter(config);
  }

  function stripParametersFromRoute(route) {
    var colonIndex = route.indexOf(":");
    var length = colonIndex > 0 ? colonIndex - 1 : route.length;
    return route.substr(0, length);
  }
  return {
    setters: [function (_routeFilters) {
      RouteFilterContainer = _routeFilters.RouteFilterContainer;
    }],
    execute: function () {
      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      RouterConfiguration = _export("RouterConfiguration", (function () {
        function RouterConfiguration() {
          this.instructions = [];
          this.options = {};
          this.pipelineSteps = [];
        }

        _prototypeProperties(RouterConfiguration, null, {
          addPipelineStep: {
            value: function addPipelineStep(name, step) {
              this.pipelineSteps.push({ name: name, step: step });
            },
            writable: true,
            configurable: true
          },
          map: {
            value: function map(route, config) {
              if (Array.isArray(route)) {
                for (var i = 0; i < route.length; i++) {
                  this.map(route[i]);
                }

                return this;
              }

              if (typeof route == "string") {
                if (!config) {
                  config = {};
                } else if (typeof config == "string") {
                  config = { moduleId: config };
                }

                config.route = route;
              } else {
                config = route;
              }

              return this.mapRoute(config);
            },
            writable: true,
            configurable: true
          },
          mapRoute: {
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
            },
            writable: true,
            configurable: true
          },
          mapUnknownRoutes: {
            value: function mapUnknownRoutes(config) {
              this.unknownRouteConfig = config;
              return this;
            },
            writable: true,
            configurable: true
          },
          exportToRouter: {
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
                  throw new Error("Pipeline steps can only be added to the root router");
                }

                filterContainer = router.container.get(RouteFilterContainer);
                for (i = 0, ii = pipelineSteps.length; i < ii; ++i) {
                  var name = pipelineSteps[i].name;
                  var step = pipelineSteps[i].step;
                  filterContainer.addStep(name, step);
                }
              }
            },
            writable: true,
            configurable: true
          },
          configureRoute: {
            value: function configureRoute(router, config, navModel) {
              this.ensureDefaultsForRouteConfig(config);
              router.addRoute(config, navModel);
            },
            writable: true,
            configurable: true
          },
          ensureDefaultsForRouteConfig: {
            value: function ensureDefaultsForRouteConfig(config) {
              config.name = ensureConfigValue(config, "name", this.deriveName);
              config.route = ensureConfigValue(config, "route", this.deriveRoute);
              config.title = ensureConfigValue(config, "title", this.deriveTitle);
              config.moduleId = ensureConfigValue(config, "moduleId", this.deriveModuleId);
            },
            writable: true,
            configurable: true
          },
          deriveName: {
            value: function deriveName(config) {
              return config.title || (config.route ? stripParametersFromRoute(config.route) : config.moduleId);
            },
            writable: true,
            configurable: true
          },
          deriveRoute: {
            value: function deriveRoute(config) {
              return config.moduleId || config.name;
            },
            writable: true,
            configurable: true
          },
          deriveTitle: {
            value: function deriveTitle(config) {
              var value = config.name;
              return value ? value.substr(0, 1).toUpperCase() + value.substr(1) : null;
            },
            writable: true,
            configurable: true
          },
          deriveModuleId: {
            value: function deriveModuleId(config) {
              return stripParametersFromRoute(config.route);
            },
            writable: true,
            configurable: true
          }
        });

        return RouterConfiguration;
      })());
    }
  };
});