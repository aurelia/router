import {RouteFilterContainer} from './route-filters';

export class RouterConfiguration{
  constructor() {
    this.instructions = [];
    this.options = {};
    this.pipelineSteps = [];
  }

  addPipelineStep(name, step) {
    this.pipelineSteps.push({name, step});
  }

  map(route) {
    if (Array.isArray(route)) {
      route.forEach(this.map.bind(this));
      return this;
    }

    return this.mapRoute(route);
  }

  mapRoute(config) {
    this.instructions.push(router => {
      let routeConfigs = [];

      if (Array.isArray(config.route)) {
        for (let i = 0, ii = config.route.length; i < ii; i++) {
          let current = Object.assign({}, config);
          current.route = config.route[i];
          routeConfigs.push(current);
        }
      } else {
        routeConfigs.push(Object.assign({}, config));
      }

      let navModel;
      for (let i = 0, ii = routeConfigs.length; i < ii; i++) {
        let routeConfig = routeConfigs[i];
        routeConfig.settings = routeConfig.settings || {};
        if (!navModel) {
          navModel = router.createNavModel(routeConfig);
        }

        router.addRoute(routeConfig, navModel);
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
        pipelineSteps = this.pipelineSteps,
        i, ii, filterContainer;

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
      // Pipeline steps should only be added at the app router
      if (!router.isRoot) {
        throw new Error('Pipeline steps can only be added to the root router');
      }

      filterContainer = router.container.get(RouteFilterContainer);
      for (i = 0, ii = pipelineSteps.length; i < ii; ++i) {
        var {name, step} = pipelineSteps[i];
        filterContainer.addStep(name, step);
      }
    }
  }
}
