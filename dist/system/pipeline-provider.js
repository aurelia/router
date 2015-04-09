System.register(['aurelia-dependency-injection', './pipeline', './navigation-plan', './route-loading', './navigation-context', './activation', './route-filters'], function (_export) {
  var Container, Pipeline, BuildNavigationPlanStep, LoadRouteStep, CommitChangesStep, CanDeactivatePreviousStep, CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep, createRouteFilterStep, _classCallCheck, _createClass, PipelineProvider;

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
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      PipelineProvider = (function () {
        function PipelineProvider(container) {
          _classCallCheck(this, PipelineProvider);

          this.container = container;
          this.steps = [BuildNavigationPlanStep, CanDeactivatePreviousStep, LoadRouteStep, createRouteFilterStep('authorize'), createRouteFilterStep('modelbind'), CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep, createRouteFilterStep('precommit'), CommitChangesStep];
        }

        _createClass(PipelineProvider, [{
          key: 'createPipeline',
          value: function createPipeline(navigationContext) {
            var _this = this;

            var pipeline = new Pipeline();
            this.steps.forEach(function (step) {
              return pipeline.withStep(_this.container.get(step));
            });
            return pipeline;
          }
        }], [{
          key: 'inject',
          value: function inject() {
            return [Container];
          }
        }]);

        return PipelineProvider;
      })();

      _export('PipelineProvider', PipelineProvider);
    }
  };
});