System.register(["aurelia-dependency-injection", "./pipeline", "./navigation-plan", "./model-binding", "./route-loading", "./navigation-context", "./activation"], function (_export) {
  "use strict";

  var Container, Pipeline, BuildNavigationPlanStep, ApplyModelBindersStep, LoadRouteStep, CommitChangesStep, CanDeactivatePreviousStep, CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep, _prototypeProperties, PipelineProvider;
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
      _prototypeProperties = function (child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
      };

      PipelineProvider = (function () {
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
      _export("PipelineProvider", PipelineProvider);
    }
  };
});