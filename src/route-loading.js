import {activationStrategy, _buildNavigationPlan} from './navigation-plan';

export class RouteLoader {
  loadRoute(router: any, config: any, navigationInstruction: any) {
    throw Error('Route loaders must implement "loadRoute(router, config, navigationInstruction)".');
  }
}

export class LoadRouteStep {
  static inject() { return [RouteLoader]; }

  constructor(routeLoader: RouteLoader) {
    this.routeLoader = routeLoader;
  }

  run(navigationInstruction: NavigationInstruction, next: Function) {
    return loadNewRoute(this.routeLoader, navigationInstruction)
      .then(next)
      .catch(next.cancel);
  }
}

function loadNewRoute(routeLoader: RouteLoader, navigationInstruction: NavigationInstruction) {
  let toLoad = determineWhatToLoad(navigationInstruction);
  let loadPromises = toLoad.map((current) => loadRoute(
    routeLoader,
    current.navigationInstruction,
    current.viewPortPlan
    )
  );

  return Promise.all(loadPromises);
}

function determineWhatToLoad(navigationInstruction: NavigationInstruction, toLoad: Array<Object> = []) {
  let plan = navigationInstruction.plan;

  for (let viewPortName in plan) {
    let viewPortPlan = plan[viewPortName];

    if (viewPortPlan.strategy === activationStrategy.replace) {
      toLoad.push({ viewPortPlan, navigationInstruction });

      if (viewPortPlan.childNavigationInstruction) {
        determineWhatToLoad(viewPortPlan.childNavigationInstruction, toLoad);
      }
    } else {
      let viewPortInstruction = navigationInstruction.addViewPortInstruction(
        viewPortName,
        viewPortPlan.strategy,
        viewPortPlan.prevModuleId,
        viewPortPlan.prevComponent);

      if (viewPortPlan.childNavigationInstruction) {
        viewPortInstruction.childNavigationInstruction = viewPortPlan.childNavigationInstruction;
        determineWhatToLoad(viewPortPlan.childNavigationInstruction, toLoad);
      }
    }
  }

  return toLoad;
}

function loadRoute(routeLoader: RouteLoader, navigationInstruction: NavigationInstruction, viewPortPlan: any) {
  let moduleId = viewPortPlan.config ? viewPortPlan.config.moduleId : null;

  return loadComponent(routeLoader, navigationInstruction, viewPortPlan.config).then((component) => {
    let viewPortInstruction = navigationInstruction.addViewPortInstruction(
      viewPortPlan.name,
      viewPortPlan.strategy,
      moduleId,
      component);

    let childRouter = component.childRouter;
    if (childRouter) {
      let path = navigationInstruction.getWildcardPath();

      return childRouter._createNavigationInstruction(path, navigationInstruction)
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

    return undefined;
  });
}

function loadComponent(routeLoader: RouteLoader, navigationInstruction: NavigationInstruction, config: any) {
  let router = navigationInstruction.router;
  let lifecycleArgs = navigationInstruction.lifecycleArgs;

  return routeLoader.loadRoute(router, config, navigationInstruction).then((component) => {
    let {viewModel, childContainer} = component;
    component.router = router;
    component.config = config;

    if ('configureRouter' in viewModel) {
      let childRouter = childContainer.getChildRouter();
      component.childRouter = childRouter;

      return childRouter.configure(c => viewModel.configureRouter(c, childRouter, ...lifecycleArgs))
        .then(() => component);
    }

    return component;
  });
}
