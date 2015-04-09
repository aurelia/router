define(['exports', './router', './app-router', './pipeline-provider', './navigation-commands', './route-loading', './router-configuration', './navigation-plan', './route-filters'], function (exports, _router, _appRouter, _pipelineProvider, _navigationCommands, _routeLoading, _routerConfiguration, _navigationPlan, _routeFilters) {
  'use strict';

  Object.defineProperty(exports, '__esModule', {
    value: true
  });
  Object.defineProperty(exports, 'Router', {
    enumerable: true,
    get: function get() {
      return _router.Router;
    }
  });
  Object.defineProperty(exports, 'AppRouter', {
    enumerable: true,
    get: function get() {
      return _appRouter.AppRouter;
    }
  });
  Object.defineProperty(exports, 'PipelineProvider', {
    enumerable: true,
    get: function get() {
      return _pipelineProvider.PipelineProvider;
    }
  });
  Object.defineProperty(exports, 'Redirect', {
    enumerable: true,
    get: function get() {
      return _navigationCommands.Redirect;
    }
  });
  Object.defineProperty(exports, 'RouteLoader', {
    enumerable: true,
    get: function get() {
      return _routeLoading.RouteLoader;
    }
  });
  Object.defineProperty(exports, 'RouterConfiguration', {
    enumerable: true,
    get: function get() {
      return _routerConfiguration.RouterConfiguration;
    }
  });
  Object.defineProperty(exports, 'NO_CHANGE', {
    enumerable: true,
    get: function get() {
      return _navigationPlan.NO_CHANGE;
    }
  });
  Object.defineProperty(exports, 'INVOKE_LIFECYCLE', {
    enumerable: true,
    get: function get() {
      return _navigationPlan.INVOKE_LIFECYCLE;
    }
  });
  Object.defineProperty(exports, 'REPLACE', {
    enumerable: true,
    get: function get() {
      return _navigationPlan.REPLACE;
    }
  });
  Object.defineProperty(exports, 'RouteFilterContainer', {
    enumerable: true,
    get: function get() {
      return _routeFilters.RouteFilterContainer;
    }
  });
  Object.defineProperty(exports, 'createRouteFilterStep', {
    enumerable: true,
    get: function get() {
      return _routeFilters.createRouteFilterStep;
    }
  });
});