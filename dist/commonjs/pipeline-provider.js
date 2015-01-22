"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

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
var PipelineProvider = (function () {
  function PipelineProvider(container) {
    this.container = container;
    this.steps = [BuildNavigationPlanStep, CanDeactivatePreviousStep, LoadRouteStep, ApplyModelBindersStep, CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep, CommitChangesStep];
  }

  _prototypeProperties(PipelineProvider, {
    inject: {
      value: function inject() {
        return [Container];
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  }, {
    createPipeline: {
      value: function createPipeline(navigationContext) {
        var _this = this;
        var pipeline = new Pipeline();
        this.steps.forEach(function (step) {
          return pipeline.withStep(_this.container.get(step));
        });
        return pipeline;
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return PipelineProvider;
})();

exports.PipelineProvider = PipelineProvider;