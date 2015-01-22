"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

exports.loadNewRoute = loadNewRoute;
var REPLACE = require("./navigation-plan").REPLACE;
var buildNavigationPlan = require("./navigation-plan").buildNavigationPlan;
var RouteLoader = (function () {
  function RouteLoader() {}

  _prototypeProperties(RouteLoader, null, {
    loadRoute: {
      value: function loadRoute(router, config) {
        throw Error("Route loaders must implment \"loadRoute(router, config)\".");
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return RouteLoader;
})();

exports.RouteLoader = RouteLoader;
var LoadRouteStep = (function () {
  function LoadRouteStep(routeLoader) {
    this.routeLoader = routeLoader;
  }

  _prototypeProperties(LoadRouteStep, {
    inject: {
      value: function inject() {
        return [RouteLoader];
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  }, {
    run: {
      value: function run(navigationContext, next) {
        return loadNewRoute([], this.routeLoader, navigationContext).then(next)["catch"](next.cancel);
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return LoadRouteStep;
})();

exports.LoadRouteStep = LoadRouteStep;
function loadNewRoute(routers, routeLoader, navigationContext) {
  var toLoad = determineWhatToLoad(navigationContext);
  var loadPromises = toLoad.map(function (current) {
    return loadRoute(routers, routeLoader, current.navigationContext, current.viewPortPlan);
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

function loadRoute(routers, routeLoader, navigationContext, viewPortPlan) {
  var moduleId = viewPortPlan.config.moduleId;
  var next = navigationContext.nextInstruction;

  routers.push(navigationContext.router);

  return loadComponent(routeLoader, navigationContext.router, viewPortPlan.config).then(function (component) {
    var viewPortInstruction = next.addViewPortInstruction(viewPortPlan.name, viewPortPlan.strategy, moduleId, component);

    var controller = component.executionContext;

    if (controller.router && routers.indexOf(controller.router) === -1) {
      var path = next.getWildcardPath();

      return controller.router.createNavigationInstruction(path, next).then(function (childInstruction) {
        viewPortPlan.childNavigationContext = controller.router.createNavigationContext(childInstruction);

        return buildNavigationPlan(viewPortPlan.childNavigationContext).then(function (childPlan) {
          viewPortPlan.childNavigationContext.plan = childPlan;
          viewPortInstruction.childNavigationContext = viewPortPlan.childNavigationContext;

          return loadNewRoute(routers, routeLoader, viewPortPlan.childNavigationContext);
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