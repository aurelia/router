define(["exports", "aurelia-dependency-injection", "./pipeline", "./navigation-plan", "./model-binding", "./route-loading", "./navigation-context", "./activation"], function (exports, _aureliaDependencyInjection, _pipeline, _navigationPlan, _modelBinding, _routeLoading, _navigationContext, _activation) {
  "use strict";

  var Container = _aureliaDependencyInjection.Container;
  var Pipeline = _pipeline.Pipeline;
  var BuildNavigationPlanStep = _navigationPlan.BuildNavigationPlanStep;
  var ApplyModelBindersStep = _modelBinding.ApplyModelBindersStep;
  var LoadRouteStep = _routeLoading.LoadRouteStep;
  var CommitChangesStep = _navigationContext.CommitChangesStep;
  var CanDeactivatePreviousStep = _activation.CanDeactivatePreviousStep;
  var CanActivateNextStep = _activation.CanActivateNextStep;
  var DeactivatePreviousStep = _activation.DeactivatePreviousStep;
  var ActivateNextStep = _activation.ActivateNextStep;
  var PipelineProvider = (function () {
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

    return PipelineProvider;
  })();

  exports.PipelineProvider = PipelineProvider;
});