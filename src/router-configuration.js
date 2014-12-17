import {extend} from './util';

export class RouterConfiguration{
  constructor() {
    this.instructions = [];
  }

  map(route, config) {
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

  mapRoute(config) {
    this.instructions.push(router => {
      if (Array.isArray(config.route)) {
        var navModel = {}, i, ii, current;

        for (i = 0, ii = config.route.length; i < ii; ++i) {
          current = extend({}, config);
          current.route = config.route[i];
          this.configureRoute(router, current, navModel);
        }
      } else {
        this.configureRoute(router, extend({}, config));
      }
    });

    return this;
  }

  mapUnknownRoutes(config) {
    this.unknownRouteConfig = config;
    return this;
  }

  exportToRouter(router) {
    var instructions = this.instructions,
        i, ii;

    for (i = 0, ii = instructions.length; i < ii; ++i) {
      instructions[i](router);
    }

    if (this.title) {
      router.title = this.title;
    }

    if (this.unknownRouteConfig) {
      router.handleUnknownRoutes(this.unknownRouteConfig);
    }
  }

  configureRoute(router, config, navModel) {
    this.ensureDefaultsForRouteConfig(config);
    router.addRoute(config, navModel);
  }

  ensureDefaultsForRouteConfig(config) {
    config.name =  ensureConfigValue(config, 'name', this.deriveName);
    config.route = ensureConfigValue(config, 'route', this.deriveRoute);
    config.title = ensureConfigValue(config, 'title', this.deriveTitle);
    config.moduleId = ensureConfigValue(config, 'moduleId', this.deriveModuleId);
  }

  deriveName(config) {
    return config.title || (config.route ? stripParametersFromRoute(config.route) : config.moduleId);
  }

  deriveRoute(config) {
    return config.moduleId || config.name;
  }

  deriveTitle(config) {
    var value = config.name;
    return value.substr(0, 1).toUpperCase() + value.substr(1);
  }

  deriveModuleId(config) {
    return stripParametersFromRoute(config.route);
  }
}

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