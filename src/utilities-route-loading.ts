import { RouteConfig, ViewPortComponent, ViewPortPlan, ViewPortInstruction } from './interfaces';
import { Redirect } from './redirect';
import { NavigationInstruction } from './navigation-instruction';
import { _buildNavigationPlan } from './navigation-plan';
import { InternalActivationStrategy } from './activation-strategy';
import { RouteLoader } from './route-loader';

/**
 * Loading plan calculated based on a navigration-instruction and a viewport plan
 */
interface ILoadingPlan {
  viewPortPlan: ViewPortPlan;
  navigationInstruction: NavigationInstruction;
}

/**
 * @internal Exported for unit testing
 */
export const loadNewRoute = (
  routeLoader: RouteLoader,
  navigationInstruction: NavigationInstruction
): Promise<any[] | void> => {
  let loadingPlans = determineLoadingPlans(navigationInstruction);
  let loadPromises = loadingPlans.map((loadingPlan: ILoadingPlan) => loadRoute(
    routeLoader,
    loadingPlan.navigationInstruction,
    loadingPlan.viewPortPlan
  ));

  return Promise.all(loadPromises);
};

/**
 * @internal Exported for unit testing
 */
export const determineLoadingPlans = (
  navigationInstruction: NavigationInstruction,
  loadingPlans: ILoadingPlan[] = []
): ILoadingPlan[] => {
  let viewPortPlans: Record<string, ViewPortPlan> = navigationInstruction.plan;

  for (let viewPortName in viewPortPlans) {
    let viewPortPlan = viewPortPlans[viewPortName];
    let childNavInstruction = viewPortPlan.childNavigationInstruction;

    if (viewPortPlan.strategy === InternalActivationStrategy.Replace) {
      loadingPlans.push({ viewPortPlan, navigationInstruction } as ILoadingPlan);

      if (childNavInstruction) {
        determineLoadingPlans(childNavInstruction, loadingPlans);
      }
    }
    else {
      let viewPortInstruction = navigationInstruction.addViewPortInstruction({
        name: viewPortName,
        strategy: viewPortPlan.strategy,
        moduleId: viewPortPlan.prevModuleId,
        component: viewPortPlan.prevComponent
      }) as ViewPortInstruction;

      if (childNavInstruction) {
        viewPortInstruction.childNavigationInstruction = childNavInstruction;
        determineLoadingPlans(childNavInstruction, loadingPlans);
      }
    }
  }

  return loadingPlans;
};

/**
 * @internal Exported for unit testing
 */
export const loadRoute = (
  routeLoader: RouteLoader,
  navigationInstruction: NavigationInstruction,
  viewPortPlan: ViewPortPlan
): Promise<any> => {
  let planConfig = viewPortPlan.config;
  let moduleId = planConfig ? planConfig.moduleId : null;

  return loadComponent(routeLoader, navigationInstruction, planConfig)
    .then((component) => {
      let viewPortInstruction = navigationInstruction.addViewPortInstruction({
        name: viewPortPlan.name,
        strategy: viewPortPlan.strategy,
        moduleId: moduleId,
        component: component
      }) as ViewPortInstruction;

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
      }
    );
};
