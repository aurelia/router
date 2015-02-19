"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var Container = require("aurelia-dependency-injection").Container;
var Pipeline = require("./pipeline").Pipeline;
var BuildNavigationPlanStep = require("./navigation-plan").BuildNavigationPlanStep;
var ApplyModelBindersStep = require("./model-binding").ApplyModelBindersStep;
var LoadRouteStep = require("./route-loading").LoadRouteStep;
var CommitChangesStep = require("./navigation-context").CommitChangesStep;
var _activation = require("./activation");

var CanDeactivatePreviousStep = _activation.CanDeactivatePreviousStep;
var CanActivateNextStep = _activation.CanActivateNextStep;
var DeactivatePreviousStep = _activation.DeactivatePreviousStep;
var ActivateNextStep = _activation.ActivateNextStep;
var createRouteFilterStep = require("./route-filters").createRouteFilterStep;
var PipelineProvider = exports.PipelineProvider = (function () {
  function PipelineProvider(container) {
    this.container = container;
    this.steps = [BuildNavigationPlanStep, CanDeactivatePreviousStep, LoadRouteStep, createRouteFilterStep("authorize"), createRouteFilterStep("modelbind"), CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep, CommitChangesStep];
  }

  _prototypeProperties(PipelineProvider, {
    inject: {
      value: function inject() {
        return [Container];
      },
      writable: true,
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
      configurable: true
    }
  });

  return PipelineProvider;
})();
exports.__esModule = true;