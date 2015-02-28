System.register(["aurelia-dependency-injection", "./pipeline", "./navigation-plan", "./model-binding", "./route-loading", "./navigation-context", "./activation", "./route-filters"], function (_export) {
  var Container, Pipeline, BuildNavigationPlanStep, ApplyModelBindersStep, LoadRouteStep, CommitChangesStep, CanDeactivatePreviousStep, CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep, createRouteFilterStep, _prototypeProperties, _classCallCheck, PipelineProvider;

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
    }, function (_routeFilters) {
      createRouteFilterStep = _routeFilters.createRouteFilterStep;
    }],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      PipelineProvider = _export("PipelineProvider", (function () {
        function PipelineProvider(container) {
          _classCallCheck(this, PipelineProvider);

          this.container = container;
          this.steps = [BuildNavigationPlanStep, CanDeactivatePreviousStep, //optional
          LoadRouteStep, createRouteFilterStep("authorize"), createRouteFilterStep("modelbind"), CanActivateNextStep, //optional
          //NOTE: app state changes start below - point of no return
          DeactivatePreviousStep, //optional
          ActivateNextStep, //optional
          createRouteFilterStep("precommit"), CommitChangesStep];
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
      })());
    }
  };
});