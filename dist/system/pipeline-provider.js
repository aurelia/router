System.register(["aurelia-dependency-injection", "./pipeline", "./navigation-plan", "./model-binding", "./route-loading", "./navigation-context", "./activation"], function (_export) {
  "use strict";

  var Container, Pipeline, BuildNavigationPlanStep, ApplyModelBindersStep, LoadRouteStep, CommitChangesStep, CanDeactivatePreviousStep, CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep, PipelineProvider;
  return {
    setters: [function (_aureliaDependencyInjection) {
      Container = _aureliaDependencyInjection.Container;
    }, function (_pipeline) {
      Pipeline = _pipeline.Pipeline;
    }, function (_navigationPlan) {
      BuildNavigationPlanStep = _navigationPlan.BuildNavigationPlanStep;
    }, function (_modelBinding) {
      ApplyModelBindersStep = _modelBinding.ApplyModelBindersStep;
    }, function (_routeLoading) {
      LoadRouteStep = _routeLoading.LoadRouteStep;
    }, function (_navigationContext) {
      CommitChangesStep = _navigationContext.CommitChangesStep;
    }, function (_activation) {
      CanDeactivatePreviousStep = _activation.CanDeactivatePreviousStep;
      CanActivateNextStep = _activation.CanActivateNextStep;
      DeactivatePreviousStep = _activation.DeactivatePreviousStep;
      ActivateNextStep = _activation.ActivateNextStep;
    }],
    execute: function () {
      PipelineProvider = function PipelineProvider(container) {
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

      _export("PipelineProvider", PipelineProvider);
    }
  };
});