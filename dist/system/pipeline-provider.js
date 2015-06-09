System.register(['aurelia-dependency-injection', './pipeline', './navigation-plan', './route-loading', './navigation-context', './activation', './route-filters'], function (_export) {
  'use strict';

  var Container, Pipeline, BuildNavigationPlanStep, LoadRouteStep, CommitChangesStep, CanDeactivatePreviousStep, CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep, createRouteFilterStep, PipelineProvider;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_aureliaDependencyInjection) {
      Container = _aureliaDependencyInjection.Container;
    }, function (_pipeline) {
      Pipeline = _pipeline.Pipeline;
    }, function (_navigationPlan) {
      BuildNavigationPlanStep = _navigationPlan.BuildNavigationPlanStep;
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
      PipelineProvider = (function () {
        function PipelineProvider(container) {
          _classCallCheck(this, PipelineProvider);

          this.container = container;
          this.steps = [BuildNavigationPlanStep, CanDeactivatePreviousStep, LoadRouteStep, createRouteFilterStep('authorize'), createRouteFilterStep('modelbind'), CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep, createRouteFilterStep('precommit'), CommitChangesStep];
        }

        PipelineProvider.inject = function inject() {
          return [Container];
        };

        PipelineProvider.prototype.createPipeline = function createPipeline(navigationContext) {
          var _this = this;

          var pipeline = new Pipeline();
          this.steps.forEach(function (step) {
            return pipeline.withStep(_this.container.get(step));
          });
          return pipeline;
        };

        return PipelineProvider;
      })();

      _export('PipelineProvider', PipelineProvider);
    }
  };
});