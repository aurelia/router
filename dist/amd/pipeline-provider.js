define(['exports', 'aurelia-dependency-injection', './pipeline', './navigation-plan', './route-loading', './navigation-context', './activation', './route-filters'], function (exports, _aureliaDependencyInjection, _pipeline, _navigationPlan, _routeLoading, _navigationContext, _activation, _routeFilters) {
  'use strict';

  exports.__esModule = true;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var PipelineProvider = (function () {
    function PipelineProvider(container) {
      _classCallCheck(this, PipelineProvider);

      this.container = container;
      this.steps = [_navigationPlan.BuildNavigationPlanStep, _activation.CanDeactivatePreviousStep, _routeLoading.LoadRouteStep, (0, _routeFilters.createRouteFilterStep)('authorize'), (0, _routeFilters.createRouteFilterStep)('modelbind'), _activation.CanActivateNextStep, _activation.DeactivatePreviousStep, _activation.ActivateNextStep, (0, _routeFilters.createRouteFilterStep)('precommit'), _navigationContext.CommitChangesStep];
    }

    PipelineProvider.inject = function inject() {
      return [_aureliaDependencyInjection.Container];
    };

    PipelineProvider.prototype.createPipeline = function createPipeline(navigationContext) {
      var _this = this;

      var pipeline = new _pipeline.Pipeline();
      this.steps.forEach(function (step) {
        return pipeline.withStep(_this.container.get(step));
      });
      return pipeline;
    };

    return PipelineProvider;
  })();

  exports.PipelineProvider = PipelineProvider;
});