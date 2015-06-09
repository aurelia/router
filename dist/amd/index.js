define(['exports', './router', './app-router', './pipeline-provider', './navigation-commands', './route-loading', './router-configuration', './navigation-context', './navigation-plan', './route-filters'], function (exports, _router, _appRouter, _pipelineProvider, _navigationCommands, _routeLoading, _routerConfiguration, _navigationContext, _navigationPlan, _routeFilters) {
  'use strict';

  exports.__esModule = true;
  exports.Router = _router.Router;
  exports.AppRouter = _appRouter.AppRouter;
  exports.PipelineProvider = _pipelineProvider.PipelineProvider;
  exports.Redirect = _navigationCommands.Redirect;
  exports.RouteLoader = _routeLoading.RouteLoader;
  exports.RouterConfiguration = _routerConfiguration.RouterConfiguration;
  exports.NavigationContext = _navigationContext.NavigationContext;
  exports.activationStrategy = _navigationPlan.activationStrategy;
  exports.RouteFilterContainer = _routeFilters.RouteFilterContainer;
  exports.createRouteFilterStep = _routeFilters.createRouteFilterStep;
});