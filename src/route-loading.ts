import { activationStrategy, _buildNavigationPlan } from './navigation-plan';
import { NavigationInstruction } from './navigation-instruction';
import { ViewPortInstruction, RouteConfig, ViewPortComponent, ViewPortPlan, ViewModelSpecifier } from './interfaces';
import { Redirect } from './navigation-commands';
import { Router } from './router';
import { Next } from './pipeline';

export class RouteLoader {
  loadRoute(router: Router, config: RouteConfig, navigationInstruction: NavigationInstruction): Promise<ViewPortComponent> {
    throw Error('Route loaders must implement "loadRoute(router, config, navigationInstruction)".');
  }
}

export class LoadRouteStep {
  /**@internal */
  static inject() { return [RouteLoader]; }
  /**@internal */
  routeLoader: RouteLoader;

  constructor(routeLoader: RouteLoader) {
    this.routeLoader = routeLoader;
  }

  run(navigationInstruction: NavigationInstruction, next: Next) {
    return loadNewRoute(this.routeLoader, navigationInstruction)
      .then(next)
      .catch(next.cancel);
  }
}

/*@internal*/export function loadNewRoute(routeLoader: RouteLoader, navigationInstruction: NavigationInstruction): Promise<any[] | void> {
  let toLoad = determineWhatToLoad(navigationInstruction);
  let loadPromises = toLoad.map((loadingPlan: ILoadingPlan) => loadRoute(
    routeLoader,
    loadingPlan.navigationInstruction,
    loadingPlan.viewPortPlan
  ));

  return Promise.all(loadPromises);
}

interface ILoadingPlan {
  viewPortPlan: ViewPortPlan;
  navigationInstruction: NavigationInstruction;
}

/**
 * Determine what are needed to be loaded based on navigation instruction's plan
 * All determined loading plans will be added to 2nd parameter array
 * @param navigationInstruction
 * @param toLoad
 */
/*@internal*/export function determineWhatToLoad(
  navigationInstruction: NavigationInstruction,
  toLoad: ILoadingPlan[] = []
): ILoadingPlan[] {
  let plans = navigationInstruction.plan;

  for (let viewPortName in plans) {
    let viewPortPlan = plans[viewPortName];

    if (viewPortPlan.strategy === activationStrategy.replace) {
      toLoad.push({ viewPortPlan, navigationInstruction } as ILoadingPlan);

      if (viewPortPlan.childNavigationInstruction) {
        determineWhatToLoad(viewPortPlan.childNavigationInstruction, toLoad);
      }
    } else {
      // let viewPortInstruction = navigationInstruction.addViewPortInstruction(
      //   viewPortName,
      //   viewPortPlan.strategy,
      //   viewPortPlan.prevModuleId,
      //   viewPortPlan.prevComponent);
      let partialInstruction: ViewPortInstruction = {
        strategy: viewPortPlan.strategy,
        component: viewPortPlan.prevComponent
      } as ViewPortInstruction;
      let prevViewModel = viewPortPlan.prevViewModel;

      if (typeof prevViewModel === 'string' || prevViewModel === null) {
        partialInstruction.moduleId = prevViewModel as string | null;
      } else if (typeof prevViewModel === 'function') {
        partialInstruction.viewModel = () => prevViewModel as Function;
      } else {
        throw new Error('Invaid previous view model specification');
      }

      let viewPortInstruction = navigationInstruction.addViewPortInstruction(
        viewPortName,
        partialInstruction
      );

      if (viewPortPlan.childNavigationInstruction) {
        viewPortInstruction.childNavigationInstruction = viewPortPlan.childNavigationInstruction;
        determineWhatToLoad(viewPortPlan.childNavigationInstruction, toLoad);
      }
    }
  }

  return toLoad;
}

/*@internal*/export async function loadRoute(
  routeLoader: RouteLoader,
  navigationInstruction: NavigationInstruction,
  viewPortPlan: ViewPortPlan
) {
  let config = viewPortPlan.config;
  let moduleId: string | null = null;
  let viewModel: ViewModelSpecifier | null = null;
  if (config) {
    if ('moduleId' in config) {
      moduleId = config.moduleId;
    }
    if ('viewModel' in config) {
      viewModel = config.viewModel;
    }
  }
  let component = await loadComponent(routeLoader, navigationInstruction, viewPortPlan.config);
  // let viewPortInstruction = navigationInstruction.addViewPortInstruction(
  //   viewPortPlan.name,
  //   viewPortPlan.strategy,
  //   moduleId,
  //   component);
  let viewPortInstruction = navigationInstruction.addViewPortInstruction(
    viewPortPlan.name,
    // Missing lifecycleArgs property
    {
      strategy: viewPortPlan.strategy,
      moduleId: moduleId,
      viewModel: viewModel,
      component
    } as ViewPortInstruction
  );

  let childRouter = component.childRouter;
  if (childRouter) {
    let path = navigationInstruction.getWildcardPath();

    const childInstruction = await childRouter._createNavigationInstruction(path, navigationInstruction);
    viewPortPlan.childNavigationInstruction = childInstruction;

    const childPlan = await _buildNavigationPlan(childInstruction);
    if (childPlan instanceof Redirect) {
      return Promise.reject(childPlan);
    }
    childInstruction.plan = childPlan;
    viewPortInstruction.childNavigationInstruction = childInstruction;
    return loadNewRoute(routeLoader, childInstruction);
  }

  return undefined;
}

/*@internal*/export async function loadComponent(
  routeLoader: RouteLoader,
  navigationInstruction: NavigationInstruction,
  config: RouteConfig
): Promise<ViewPortComponent> {
  let router = navigationInstruction.router;
  let lifecycleArgs = navigationInstruction.lifecycleArgs;

  let component = await routeLoader.loadRoute(router, config, navigationInstruction);
  let { viewModel, childContainer } = component;
  component.router = router;
  component.config = config;

  if ('configureRouter' in viewModel) {
    let childRouter = childContainer.getChildRouter();
    component.childRouter = childRouter;

    await childRouter.configure(c => viewModel.configureRouter(c, childRouter, ...lifecycleArgs));
  }

  return component;
}
