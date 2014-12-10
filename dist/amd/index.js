define(["exports", "./router", "./app-router", "./pipeline-provider", "./navigation-commands", "./route-loading", "./router-configuration"], function (exports, _router, _appRouter, _pipelineProvider, _navigationCommands, _routeLoading, _routerConfiguration) {
  "use strict";

  exports.Router = _router.Router;
  exports.AppRouter = _appRouter.AppRouter;
  exports.PipelineProvider = _pipelineProvider.PipelineProvider;
  exports.Redirect = _navigationCommands.Redirect;
  exports.RouteLoader = _routeLoading.RouteLoader;
  exports.RouterConfiguration = _routerConfiguration.RouterConfiguration;
});