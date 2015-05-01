System.register(['./navigation-plan', './router-configuration'], function (_export) {
  var activationStrategy, buildNavigationPlan, RouterConfiguration, _classCallCheck, RouteLoader, LoadRouteStep;

  _export('loadNewRoute', loadNewRoute);

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

      if (viewPortPlan.strategy == activationStrategy.replace) {
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

    return loadComponent(routeLoader, navigationContext, viewPortPlan.config).then(function (component) {
      var viewPortInstruction = next.addViewPortInstruction(viewPortPlan.name, viewPortPlan.strategy, moduleId, component);

      var controller = component.executionContext,
          childRouter = component.childRouter;

      if (childRouter) {
        var path = next.getWildcardPath();

        return childRouter.createNavigationInstruction(path, next).then(function (childInstruction) {
          viewPortPlan.childNavigationContext = childRouter.createNavigationContext(childInstruction);

          return buildNavigationPlan(viewPortPlan.childNavigationContext).then(function (childPlan) {
            viewPortPlan.childNavigationContext.plan = childPlan;
            viewPortInstruction.childNavigationContext = viewPortPlan.childNavigationContext;

            return loadNewRoute(routeLoader, viewPortPlan.childNavigationContext);
          });
        });
      }
    });
  }

  function loadComponent(routeLoader, navigationContext, config) {
    var router = navigationContext.router,
        lifecycleArgs = navigationContext.nextInstruction.lifecycleArgs;

    return routeLoader.loadRoute(router, config).then(function (component) {
      component.router = router;
      component.config = config;

      if ('configureRouter' in component.executionContext) {
        var _component$executionContext;

        component.childRouter = component.childContainer.getChildRouter();

        var config = new RouterConfiguration();
        var result = Promise.resolve((_component$executionContext = component.executionContext).configureRouter.apply(_component$executionContext, [config, component.childRouter].concat(lifecycleArgs)));

        return result.then(function () {
          component.childRouter.configure(config);
          return component;
        });
      }

      return component;
    });
  }
  return {
    setters: [function (_navigationPlan) {
      activationStrategy = _navigationPlan.activationStrategy;
      buildNavigationPlan = _navigationPlan.buildNavigationPlan;
    }, function (_routerConfiguration) {
      RouterConfiguration = _routerConfiguration.RouterConfiguration;
    }],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      RouteLoader = (function () {
        function RouteLoader() {
          _classCallCheck(this, RouteLoader);
        }

        RouteLoader.prototype.loadRoute = function loadRoute(router, config) {
          throw Error('Route loaders must implment "loadRoute(router, config)".');
        };

        return RouteLoader;
      })();

      _export('RouteLoader', RouteLoader);

      LoadRouteStep = (function () {
        function LoadRouteStep(routeLoader) {
          _classCallCheck(this, LoadRouteStep);

          this.routeLoader = routeLoader;
        }

        LoadRouteStep.inject = function inject() {
          return [RouteLoader];
        };

        LoadRouteStep.prototype.run = function run(navigationContext, next) {
          return loadNewRoute(this.routeLoader, navigationContext).then(next)['catch'](next.cancel);
        };

        return LoadRouteStep;
      })();

      _export('LoadRouteStep', LoadRouteStep);
    }
  };
});