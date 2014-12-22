"use strict";

var RouterConfiguration = (function () {
  var RouterConfiguration = function RouterConfiguration() {
    this.instructions = [];
  };

  RouterConfiguration.prototype.map = function (route, config) {
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
  };

  RouterConfiguration.prototype.mapRoute = function (config) {
    var _this = this;
    this.instructions.push(function (router) {
      if (Array.isArray(config.route)) {
        var navModel = {}, i, ii, current;

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
  };

  RouterConfiguration.prototype.mapUnknownRoutes = function (config) {
    this.unknownRouteConfig = config;
    return this;
  };

  RouterConfiguration.prototype.exportToRouter = function (router) {
    var instructions = this.instructions, i, ii;

    for (i = 0, ii = instructions.length; i < ii; ++i) {
      instructions[i](router);
    }

    if (this.title) {
      router.title = this.title;
    }

    if (this.unknownRouteConfig) {
      router.handleUnknownRoutes(this.unknownRouteConfig);
    }
  };

  RouterConfiguration.prototype.configureRoute = function (router, config, navModel) {
    this.ensureDefaultsForRouteConfig(config);
    router.addRoute(config, navModel);
  };

  RouterConfiguration.prototype.ensureDefaultsForRouteConfig = function (config) {
    config.name = ensureConfigValue(config, "name", this.deriveName);
    config.route = ensureConfigValue(config, "route", this.deriveRoute);
    config.title = ensureConfigValue(config, "title", this.deriveTitle);
    config.moduleId = ensureConfigValue(config, "moduleId", this.deriveModuleId);
  };

  RouterConfiguration.prototype.deriveName = function (config) {
    return config.title || (config.route ? stripParametersFromRoute(config.route) : config.moduleId);
  };

  RouterConfiguration.prototype.deriveRoute = function (config) {
    return config.moduleId || config.name;
  };

  RouterConfiguration.prototype.deriveTitle = function (config) {
    var value = config.name;
    return value.substr(0, 1).toUpperCase() + value.substr(1);
  };

  RouterConfiguration.prototype.deriveModuleId = function (config) {
    return stripParametersFromRoute(config.route);
  };

  return RouterConfiguration;
})();

exports.RouterConfiguration = RouterConfiguration;


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