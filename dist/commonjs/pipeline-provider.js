"use strict";

var Container = require("aurelia-dependency-injection").Container;
var Pipeline = require("./pipeline").Pipeline;
var BuildNavigationPlanStep = require("./navigation-plan").BuildNavigationPlanStep;
var ApplyModelBindersStep = require("./model-binding").ApplyModelBindersStep;
var LoadRouteStep = require("./route-loading").LoadRouteStep;
var CommitChangesStep = require("./navigation-context").CommitChangesStep;
var CanDeactivatePreviousStep = require("./activation").CanDeactivatePreviousStep;
var CanActivateNextStep = require("./activation").CanActivateNextStep;
var DeactivatePreviousStep = require("./activation").DeactivatePreviousStep;
var ActivateNextStep = require("./activation").ActivateNextStep;
var PipelineProvider = function PipelineProvider(container) {
  this.container = container;
  this.steps = [BuildNavigationPlanStep, CanDeactivatePreviousStep, LoadRouteStep, ApplyModelBindersStep, CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep, CommitChangesStep];
};

PipelineProvider.inject = function () {
  return [Container];
};

PipelineProvider.prototype.createPipeline = function (navigationContext) {
  var _this = this;
  var pipeline = new Pipeline();
  this.steps.forEach(function (step) {
    return pipeline.withStep(_this.container.get(step));
  });
  return pipeline;
};

exports.PipelineProvider = PipelineProvider;