define(["exports", "aurelia-dependency-injection", "./pipeline", "./navigation-plan", "./model-binding", "./route-loading", "./navigation-context", "./activation"], function (exports, _aureliaDependencyInjection, _pipeline, _navigationPlan, _modelBinding, _routeLoading, _navigationContext, _activation) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

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
  var PipelineProvider = exports.PipelineProvider = (function () {
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
});