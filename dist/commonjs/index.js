"use strict";

exports.Router = require("./router").Router;
exports.AppRouter = require("./app-router").AppRouter;
exports.PipelineProvider = require("./pipeline-provider").PipelineProvider;
exports.Redirect = require("./navigation-commands").Redirect;
exports.RouteLoader = require("./route-loading").RouteLoader;
exports.RouterConfiguration = require("./router-configuration").RouterConfiguration;

var _navigationPlan = require("./navigation-plan");

exports.NO_CHANGE = _navigationPlan.NO_CHANGE;
exports.INVOKE_LIFECYCLE = _navigationPlan.INVOKE_LIFECYCLE;
exports.REPLACE = _navigationPlan.REPLACE;

var _routeFilters = require("./route-filters");

exports.RouteFilterContainer = _routeFilters.RouteFilterContainer;
exports.createRouteFilterStep = _routeFilters.createRouteFilterStep;
Object.defineProperty(exports, "__esModule", {
  value: true
});