define(["exports", "./navigation-plan"], function (exports, _navigationPlan) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  exports.loadNewRoute = loadNewRoute;
  var REPLACE = _navigationPlan.REPLACE;
  var buildNavigationPlan = _navigationPlan.buildNavigationPlan;

  var RouteLoader = exports.RouteLoader = (function () {
    function RouteLoader() {
      _classCallCheck(this, RouteLoader);
    }

    _prototypeProperties(RouteLoader, null, {
      loadRoute: {
        value: function loadRoute(router, config) {
          throw Error("Route loaders must implment \"loadRoute(router, config)\".");
        },
        writable: true,
        configurable: true
      }
    });

    return RouteLoader;
  })();

  var LoadRouteStep = exports.LoadRouteStep = (function () {
    function LoadRouteStep(routeLoader) {
      _classCallCheck(this, LoadRouteStep);

      this.routeLoader = routeLoader;
    }

    _prototypeProperties(LoadRouteStep, {
      inject: {
        value: function inject() {
          return [RouteLoader];
        },
        writable: true,
        configurable: true
      }
    }, {
      run: {
        value: function run(navigationContext, next) {
          return loadNewRoute([], this.routeLoader, navigationContext).then(next)["catch"](next.cancel);
        },
        writable: true,
        configurable: true
      }
    });

    return LoadRouteStep;
  })();

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
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
});