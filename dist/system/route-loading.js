System.register(['./navigation-plan', './router-configuration'], function (_export) {
  'use strict';

  var activationStrategy, buildNavigationPlan, RouterConfiguration, RouteLoader, LoadRouteStep;

  _export('loadNewRoute', loadNewRoute);

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

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
          var childNavigationContext = childRouter.createNavigationContext(childInstruction);
          viewPortPlan.childNavigationContext = childNavigationContext;

          return buildNavigationPlan(childNavigationContext).then(function (childPlan) {
            childNavigationContext.plan = childPlan;
            viewPortInstruction.childNavigationContext = childNavigationContext;

            return loadNewRoute(routeLoader, childNavigationContext);
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