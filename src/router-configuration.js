import {RouteConfig} from './interfaces';

/**
 * Class used to configure a [[Router]] instance.
 *
 * @constructor
 */
export class RouterConfiguration {
  instructions = [];
  options: any = {};
  pipelineSteps: Array<Function|PipelineStep> = [];
  title: string;
  unknownRouteConfig: any;

  /**
  * Adds a step to be run during the [[Router]]'s navigation pipeline.
  *
  * @param name The name of the pipeline slot to insert the step into.
  * @param step The pipeline step.
  * @chainable
  */
  addPipelineStep(name: string, step: Function|PipelineStep): RouterConfiguration {
    this.pipelineSteps.push({name, step});
    return this;
  }

  /**
  * Adds a step to be run during the [[Router]]'s authorize pipeline slot.
  *
  * @param step The pipeline step.
  * @chainable
  */
  addAuthorizeStep(step: Function|PipelineStep): RouterConfiguration {
    return this.addPipelineStep('authorize', step);
  }

  /**
  * Adds a step to be run during the [[Router]]'s preActivate pipeline slot.
  *
  * @param step The pipeline step.
  * @chainable
  */
  addPreActivateStep(step: Function|PipelineStep): RouterConfiguration {
    return this.addPipelineStep('preActivate', step);
  }

  /**
  * Adds a step to be run during the [[Router]]'s preRender pipeline slot.
  *
  * @param step The pipeline step.
  * @chainable
  */
  addPreRenderStep(step: Function|PipelineStep): RouterConfiguration {
    return this.addPipelineStep('preRender', step);
  }

  /**
  * Adds a step to be run during the [[Router]]'s postRender pipeline slot.
  *
  * @param step The pipeline step.
  * @chainable
  */
  addPostRenderStep(step: Function|PipelineStep): RouterConfiguration {
    return this.addPipelineStep('postRender', step);
  }

  /**
  * Maps one or more routes to be registered with the router.
  *
  * @param route The [[RouteConfig]] to map, or an array of [[RouteConfig]] to map.
  * @chainable
  */
  map(route: RouteConfig|RouteConfig[]): RouterConfiguration {
    if (Array.isArray(route)) {
      route.forEach(this.map.bind(this));
      return this;
    }

    return this.mapRoute(route);
  }

  /**
  * Maps a single route to be registered with the router.
  *
  * @param route The [[RouteConfig]] to map.
  * @chainable
  */
  mapRoute(config: RouteConfig): RouterConfiguration {
    this.instructions.push(router => {
      let routeConfigs = [];

      if (Array.isArray(config.route)) {
        for (let i = 0, ii = config.route.length; i < ii; ++i) {
          let current = Object.assign({}, config);
          current.route = config.route[i];
          routeConfigs.push(current);
        }
      } else {
        routeConfigs.push(Object.assign({}, config));
      }

      let navModel;
      for (let i = 0, ii = routeConfigs.length; i < ii; ++i) {
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

  /**
  * Registers an unknown route handler to be run when the URL fragment doesn't match any registered routes.
  *
  * @param config A string containing a moduleId to load, or a [[RouteConfig]], or a function that takes the
  *  [[NavigationInstruction]] and selects a moduleId to load.
  * @chainable
  */
  mapUnknownRoutes(config: string|RouteConfig|((instruction: NavigationInstruction) => string|RouteConfig|Promise<string|RouteConfig>)): RouterConfiguration {
    this.unknownRouteConfig = config;
    return this;
  }

  /**
  * Applies the current configuration to the specified [[Router]].
  *
  * @param router The [[Router]] to apply the configuration to.
  */
  exportToRouter(router: Router): void {
    let instructions = this.instructions;
    for (let i = 0, ii = instructions.length; i < ii; ++i) {
      instructions[i](router);
    }

    if (this.title) {
      router.title = this.title;
    }

    if (this.unknownRouteConfig) {
      router.handleUnknownRoutes(this.unknownRouteConfig);
    }

    router.options = this.options;

    let pipelineSteps = this.pipelineSteps;
    if (pipelineSteps.length) {
      if (!router.isRoot) {
        throw new Error('Pipeline steps can only be added to the root router');
      }

      let pipelineProvider = router.pipelineProvider;
      for (let i = 0, ii = pipelineSteps.length; i < ii; ++i) {
        let {name, step} = pipelineSteps[i];
        pipelineProvider.addStep(name, step);
      }
    }
  }
}
