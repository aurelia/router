System.register(["./router", "./app-router", "./pipeline-provider", "./navigation-commands", "./route-loading", "./router-configuration"], function (_export) {
  "use strict";

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
    }],
    execute: function () {}
  };
});