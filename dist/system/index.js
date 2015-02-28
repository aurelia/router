System.register(["./router", "./app-router", "./pipeline-provider", "./navigation-commands", "./route-loading", "./router-configuration", "./navigation-plan", "./route-filters"], function (_export) {
  return {
    setters: [function (_router) {
      _export("Router", _router.Router);
    }, function (_appRouter) {
      _export("AppRouter", _appRouter.AppRouter);
    }, function (_pipelineProvider) {
      _export("PipelineProvider", _pipelineProvider.PipelineProvider);
    }, function (_navigationCommands) {
      _export("Redirect", _navigationCommands.Redirect);
    }, function (_routeLoading) {
      _export("RouteLoader", _routeLoading.RouteLoader);
    }, function (_routerConfiguration) {
      _export("RouterConfiguration", _routerConfiguration.RouterConfiguration);
    }, function (_navigationPlan) {
      _export("NO_CHANGE", _navigationPlan.NO_CHANGE);

      _export("INVOKE_LIFECYCLE", _navigationPlan.INVOKE_LIFECYCLE);

      _export("REPLACE", _navigationPlan.REPLACE);
    }, function (_routeFilters) {
      _export("RouteFilterContainer", _routeFilters.RouteFilterContainer);

      _export("createRouteFilterStep", _routeFilters.createRouteFilterStep);
    }],
    execute: function () {
      "use strict";
    }
  };
});