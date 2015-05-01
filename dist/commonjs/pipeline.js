'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

exports.__esModule = true;

var _core = require('core-js');

var _core2 = _interopRequireDefault(_core);

function createResult(ctx, next) {
  return {
    status: next.status,
    context: ctx,
    output: next.output,
    completed: next.status == pipelineStatus.completed
  };
}

var pipelineStatus = {
  completed: 'completed',
  cancelled: 'cancelled',
  rejected: 'rejected',
  running: 'running'
};

exports.pipelineStatus = pipelineStatus;

var Pipeline = (function () {
  function Pipeline() {
    _classCallCheck(this, Pipeline);

    this.steps = [];
  }

  Pipeline.prototype.withStep = function withStep(step) {
    var run, steps, i, l;

    if (typeof step == 'function') {
      run = step;
    } else if (step.isMultiStep) {
      steps = step.getSteps();
      for (i = 0, l = steps.length; i < l; i++) {
        this.withStep(steps[i]);
      }

      return this;
    } else {
      run = step.run.bind(step);
    }

    this.steps.push(run);

    return this;
  };

  Pipeline.prototype.run = function run(ctx) {
    var index = -1,
        steps = this.steps,
        next,
        currentStep;

    next = function () {
      index++;

      if (index < steps.length) {
        currentStep = steps[index];

        try {
          return currentStep(ctx, next);
        } catch (e) {
          return next.reject(e);
        }
      } else {
        return next.complete();
      }
    };

    next.complete = function (output) {
      next.status = pipelineStatus.completed;
      next.output = output;
      return Promise.resolve(createResult(ctx, next));
    };

    next.cancel = function (reason) {
      next.status = pipelineStatus.cancelled;
      next.output = reason;
      return Promise.resolve(createResult(ctx, next));
    };

    next.reject = function (error) {
      next.status = pipelineStatus.rejected;
      next.output = error;
      return Promise.reject(createResult(ctx, next));
    };

    next.status = pipelineStatus.running;

    return next();
  };

  return Pipeline;
})();

exports.Pipeline = Pipeline;