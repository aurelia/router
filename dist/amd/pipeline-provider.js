define(['exports', 'aurelia-dependency-injection', './pipeline', './navigation-plan', './route-loading', './navigation-context', './activation', './route-filters'], function (exports, _aureliaDependencyInjection, _pipeline, _navigationPlan, _routeLoading, _navigationContext, _activation, _routeFilters) {
  'use strict';

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  var PipelineProvider = (function () {
    function PipelineProvider(container) {
      _classCallCheck(this, PipelineProvider);

      this.container = container;
      this.steps = [_navigationPlan.BuildNavigationPlanStep, _activation.CanDeactivatePreviousStep, _routeLoading.LoadRouteStep, _routeFilters.createRouteFilterStep('authorize'), _routeFilters.createRouteFilterStep('modelbind'), _activation.CanActivateNextStep, _activation.DeactivatePreviousStep, _activation.ActivateNextStep, _routeFilters.createRouteFilterStep('precommit'), _navigationContext.CommitChangesStep];
    }

    _createClass(PipelineProvider, [{
      key: 'createPipeline',
      value: function createPipeline(navigationContext) {
        var _this = this;

        var pipeline = new _pipeline.Pipeline();
        this.steps.forEach(function (step) {
          return pipeline.withStep(_this.container.get(step));
        });
        return pipeline;
      }
    }], [{
      key: 'inject',
      value: function inject() {
        return [_aureliaDependencyInjection.Container];
      }
    }]);

    return PipelineProvider;
  })();

  exports.PipelineProvider = PipelineProvider;
});