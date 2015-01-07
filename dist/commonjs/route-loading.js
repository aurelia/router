"use strict";

exports.loadNewRoute = loadNewRoute;
var REPLACE = require("./navigation-plan").REPLACE;
var buildNavigationPlan = require("./navigation-plan").buildNavigationPlan;
var RouteLoader = function RouteLoader() {};

RouteLoader.prototype.loadRoute = function (router, config) {
  throw Error("Route loaders must implment \"loadRoute(router, config)\".");
};

exports.RouteLoader = RouteLoader;
var LoadRouteStep = function LoadRouteStep(routeLoader) {
  this.routeLoader = routeLoader;
};

LoadRouteStep.inject = function () {
  return [RouteLoader];
};

LoadRouteStep.prototype.run = function (navigationContext, next) {
  return loadNewRoute(this.routeLoader, navigationContext).then(next)["catch"](next.cancel);
};

exports.LoadRouteStep = LoadRouteStep;
function loadNewRoute(routeLoader, navigationContext) {
  var toLoad = determineWhatToLoad(navigationContext);
  var loadPromises = toLoad.map(function (current) {
    return loadRoute(routeLoader, current.navigationContext, current.viewPortPlan);
  });

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
      var viewPortInstruction = next.addViewPortInstruction(viewPortName, viewPortPlan.strategy, viewPortPlan.prevModuleId, viewPortPlan.prevComponent);

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

  return loadComponent(routeLoader, navigationContext.router, viewPortPlan.config).then(function (component) {
    var viewPortInstruction = next.addViewPortInstruction(viewPortPlan.name, viewPortPlan.strategy, moduleId, component);

    var controller = component.executionContext;

    if (controller.router) {
      var path = next.getWildcardPath();

      return controller.router.createNavigationInstruction(path, next).then(function (childInstruction) {
        viewPortPlan.childNavigationContext = controller.router.createNavigationContext(childInstruction);

        return buildNavigationPlan(viewPortPlan.childNavigationContext).then(function (childPlan) {
          viewPortPlan.childNavigationContext.plan = childPlan;
          viewPortInstruction.childNavigationContext = viewPortPlan.childNavigationContext;

          return loadNewRoute(routeLoader, viewPortPlan.childNavigationContext);
        });
      });
    }
  });
}

function loadComponent(routeLoader, router, config) {
  return routeLoader.loadRoute(router, config).then(function (component) {
    if ("configureRouter" in component.executionContext) {
      var result = component.executionContext.configureRouter() || Promise.resolve();
      return result.then(function () {
        return component;
      });
    }

    component.router = router;
    component.config = config;
    return component;
  });
}