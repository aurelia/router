import { Next, RouteConfig, ViewPortComponent, ViewPortPlan, ViewPortInstruction } from './interfaces';
import { Redirect } from './navigation-commands';
import { NavigationInstruction } from './navigation-instruction';
import { activationStrategy, _buildNavigationPlan } from './navigation-plan';
import { Router } from './router';

/**
 * Loading plan calculated based on a navigration-instruction and a viewport plan
 */
interface ILoadingPlan {
  viewPortPlan: ViewPortPlan;
  navigationInstruction: NavigationInstruction;
}

/**
 * Abstract class that is responsible for loading view / view model from a route config
 * The default implementation can be found in `aurelia-templating-router`
 */
export class RouteLoader {
  /**
   * Load a route config based on its viewmodel / view configuration
   */
  // return typing: return typings used to be never
  // as it was a throw. Changing it to Promise<any> should not cause any issues
  loadRoute(router: Router, config: RouteConfig, navigationInstruction: NavigationInstruction): Promise<any> {
    throw new Error('Route loaders must implement "loadRoute(router, config, navigationInstruction)".');
  }
}

/**
 * A pipeline step responsible for loading a route config of a navigation instruction
 */
export class LoadRouteStep {
  /**@internal */
  static inject() { return [RouteLoader]; }
  /**
   * Route loader isntance that will handle loading route config
   * @internal
   */
  routeLoader: RouteLoader;

  constructor(routeLoader: RouteLoader) {
    this.routeLoader = routeLoader;
  }

  run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {
    return loadNewRoute(this.routeLoader, navigationInstruction)
      .then(next, next.cancel);
  }
}

/**
 * @internal Exported for unit testing
 */
export const loadNewRoute = (
  routeLoader: RouteLoader,
  navigationInstruction: NavigationInstruction
): Promise<any[] | void> => {
  let toLoad = determineWhatToLoad(navigationInstruction);
  let loadPromises = toLoad.map((loadingPlan: ILoadingPlan) => loadRoute(
    routeLoader,
    loadingPlan.navigationInstruction,
    loadingPlan.viewPortPlan
  ));

  return Promise.all(loadPromises);
};

/**
 * @internal Exported for unit testing
 */
export const determineWhatToLoad = (
  navigationInstruction: NavigationInstruction,
  toLoad: ILoadingPlan[] = []
): ILoadingPlan[] => {
  let plan: Record<string, ViewPortPlan> = navigationInstruction.plan;

  for (let viewPortName in plan) {
    let viewPortPlan = plan[viewPortName];
    let child_nav_instruction = viewPortPlan.childNavigationInstruction;

    if (viewPortPlan.strategy === activationStrategy.replace) {
      toLoad.push({ viewPortPlan, navigationInstruction } as ILoadingPlan);

      if (child_nav_instruction) {
        determineWhatToLoad(child_nav_instruction, toLoad);
      }
    } else {
      let viewPortInstruction = navigationInstruction.addViewPortInstruction(
        viewPortName,
        viewPortPlan.strategy,
        viewPortPlan.prevModuleId,
        viewPortPlan.prevComponent
      ) as ViewPortInstruction;

      if (child_nav_instruction) {
        viewPortInstruction.childNavigationInstruction = child_nav_instruction;
        determineWhatToLoad(child_nav_instruction, toLoad);
      }
    }
  }

  return toLoad;
};

/**
 * @internal Exported for unit testing
 */
export const loadRoute = (
  routeLoader: RouteLoader,
  navigationInstruction: NavigationInstruction,
  viewPortPlan: ViewPortPlan
): Promise<any> => {
  let moduleId = viewPortPlan.config ? viewPortPlan.config.moduleId : null;

  return loadComponent(routeLoader, navigationInstruction, viewPortPlan.config)
    .then((component) => {
      let viewPortInstruction = navigationInstruction.addViewPortInstruction(
        viewPortPlan.name,
        viewPortPlan.strategy,
        moduleId,
        component
      ) as ViewPortInstruction;

      let childRouter = component.childRouter;
      if (childRouter) {
        let path = navigationInstruction.getWildcardPath();

        return childRouter
          ._createNavigationInstruction(path, navigationInstruction)
          .then((childInstruction) => {
            viewPortPlan.childNavigationInstruction = childInstruction;

            return _buildNavigationPlan(childInstruction)
              .then((childPlan) => {
                if (childPlan instanceof Redirect) {
                  return Promise.reject(childPlan);
                }
                childInstruction.plan = childPlan;
                viewPortInstruction.childNavigationInstruction = childInstruction;

                return loadNewRoute(routeLoader, childInstruction);
              });
          });
      }
      // ts complains without this, though they are same
      return void 0;
    });
};

/**
 * Load a routed-component based on navigation instruction and route config
 * @internal exported for unit testing only
 */
export const loadComponent = (
  routeLoader: RouteLoader,
  navigationInstruction: NavigationInstruction,
  config: RouteConfig
): Promise<ViewPortComponent> => {
  let router = navigationInstruction.router;
  let lifecycleArgs = navigationInstruction.lifecycleArgs;

  return Promise.resolve()
    .then(() => routeLoader.loadRoute(router, config, navigationInstruction))
    .then(
      /**
       * @param component an object carrying information about loaded route
       * typically contains information about view model, childContainer, view and router
       */
      (component: ViewPortComponent) => {
      let { viewModel, childContainer } = component;
      component.router = router;
      component.config = config;

      if ('configureRouter' in viewModel) {
        let childRouter = childContainer.getChildRouter();
        component.childRouter = childRouter;

        return childRouter
          .configure(c => viewModel.configureRouter(c, childRouter, lifecycleArgs[0], lifecycleArgs[1], lifecycleArgs[2]))
          .then(() => component);
      }

      return component;
    });
};
