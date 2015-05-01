'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

exports.__esModule = true;

var _Container = require('aurelia-dependency-injection');

var _Pipeline = require('./pipeline');

var _BuildNavigationPlanStep = require('./navigation-plan');

var _LoadRouteStep = require('./route-loading');

var _CommitChangesStep = require('./navigation-context');

var _CanDeactivatePreviousStep$CanActivateNextStep$DeactivatePreviousStep$ActivateNextStep = require('./activation');

var _createRouteFilterStep = require('./route-filters');

var PipelineProvider = (function () {
  function PipelineProvider(container) {
    _classCallCheck(this, PipelineProvider);

    this.container = container;
    this.steps = [_BuildNavigationPlanStep.BuildNavigationPlanStep, _CanDeactivatePreviousStep$CanActivateNextStep$DeactivatePreviousStep$ActivateNextStep.CanDeactivatePreviousStep, _LoadRouteStep.LoadRouteStep, _createRouteFilterStep.createRouteFilterStep('authorize'), _createRouteFilterStep.createRouteFilterStep('modelbind'), _CanDeactivatePreviousStep$CanActivateNextStep$DeactivatePreviousStep$ActivateNextStep.CanActivateNextStep, _CanDeactivatePreviousStep$CanActivateNextStep$DeactivatePreviousStep$ActivateNextStep.DeactivatePreviousStep, _CanDeactivatePreviousStep$CanActivateNextStep$DeactivatePreviousStep$ActivateNextStep.ActivateNextStep, _createRouteFilterStep.createRouteFilterStep('precommit'), _CommitChangesStep.CommitChangesStep];
  }

  PipelineProvider.inject = function inject() {
    return [_Container.Container];
  };

  PipelineProvider.prototype.createPipeline = function createPipeline(navigationContext) {
    var _this = this;

    var pipeline = new _Pipeline.Pipeline();
    this.steps.forEach(function (step) {
      return pipeline.withStep(_this.container.get(step));
    });
    return pipeline;
  };

  return PipelineProvider;
})();

exports.PipelineProvider = PipelineProvider;