import {REPLACE, buildNavigationPlan} from './navigation-plan';
import {RouterConfiguration} from './router-configuration';

export class RouteLoader {
  loadRoute(router, config){
    throw Error('Route loaders must implment "loadRoute(router, config)".');
  }
}

export class LoadRouteStep {
  static inject(){ return [RouteLoader]; }
  constructor(routeLoader){
    this.routeLoader = routeLoader;
  }

  run(navigationContext, next) {
    return loadNewRoute(this.routeLoader, navigationContext)
      .then(next)
      .catch(next.cancel);
  }
}

export function loadNewRoute(routeLoader, navigationContext) {
  var toLoad = determineWhatToLoad(navigationContext);
  var loadPromises = toLoad.map(current => loadRoute(
    routeLoader,
    current.navigationContext,
    current.viewPortPlan
    )
  );

  return Promise.all(loadPromises);
}

function determineWhatToLoad(navigationContext, toLoad) {
  var plan = navigationContext.plan;
  var next = navigationContext.nextInstruction;

  toLoad = toLoad || [];

  for (var viewPortName in plan) {
    var viewPortPlan = plan[viewPortName];

    if (viewPortPlan.strategy == REPLACE) {
      toLoad.push({
        viewPortPlan: viewPortPlan,
        navigationContext: navigationContext
      });

      if (viewPortPlan.childNavigationContext) {
        determineWhatToLoad(viewPortPlan.childNavigationContext, toLoad);
      }
    } else {
      var viewPortInstruction = next.addViewPortInstruction(
          viewPortName,
          viewPortPlan.strategy,
          viewPortPlan.prevModuleId,
          viewPortPlan.prevComponent
          );

      if (viewPortPlan.childNavigationContext) {
        viewPortInstruction.childNavigationContext = viewPortPlan.childNavigationContext;
        determineWhatToLoad(viewPortPlan.childNavigationContext, toLoad);
      }
    }
  }

  return toLoad;
}

function loadRoute(routeLoader, navigationContext, viewPortPlan) {
  var moduleId = viewPortPlan.config.moduleId;
  var next = navigationContext.nextInstruction;

  return loadComponent(routeLoader, navigationContext, viewPortPlan.config).then(component => {
    var viewPortInstruction = next.addViewPortInstruction(
      viewPortPlan.name,
      viewPortPlan.strategy,
      moduleId,
      component
      );

    var controller = component.executionContext,
        childRouter = component.childRouter;

    if(childRouter) {
      var path = next.getWildcardPath();

      return childRouter.createNavigationInstruction(path, next)
        .then(childInstruction => {
          viewPortPlan.childNavigationContext = childRouter.createNavigationContext(childInstruction);

          return buildNavigationPlan(viewPortPlan.childNavigationContext)
            .then(childPlan => {
              viewPortPlan.childNavigationContext.plan = childPlan;
              viewPortInstruction.childNavigationContext = viewPortPlan.childNavigationContext;

              return loadNewRoute(routeLoader, viewPortPlan.childNavigationContext);
            });
        });
    }
  });
}

function loadComponent(routeLoader, navigationContext, config){
  var router = navigationContext.router,
      lifecycleArgs = navigationContext.nextInstruction.lifecycleArgs;

  return routeLoader.loadRoute(router, config).then(component => {
    component.router = router;
    component.config = config;

    if('configureRouter' in component.executionContext){
      component.childRouter = component.childContainer.getChildRouter();

      var config = new RouterConfiguration();
      var result = Promise.resolve(component.executionContext.configureRouter(config, component.childRouter, ...lifecycleArgs));

      return result.then(() => {
        component.childRouter.configure(config);
        return component;
      });
    }

    return component;
  });
}
