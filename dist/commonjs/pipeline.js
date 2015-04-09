'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _core = require('core-js');

var _core2 = _interopRequireWildcard(_core);

function createResult(ctx, next) {
  return {
    status: next.status,
    context: ctx,
    output: next.output,
    completed: next.status == COMPLETED
  };
}

var COMPLETED = 'completed';
exports.COMPLETED = COMPLETED;
var CANCELLED = 'cancelled';
exports.CANCELLED = CANCELLED;
var REJECTED = 'rejected';
exports.REJECTED = REJECTED;
var RUNNING = 'running';

exports.RUNNING = RUNNING;

var Pipeline = (function () {
  function Pipeline() {
    _classCallCheck(this, Pipeline);

    this.steps = [];
  }

  _createClass(Pipeline, [{
    key: 'withStep',
    value: function withStep(step) {
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
    }
  }, {
    key: 'run',
    value: function run(ctx) {
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
        next.status = COMPLETED;
        next.output = output;
        return Promise.resolve(createResult(ctx, next));
      };

      next.cancel = function (reason) {
        next.status = CANCELLED;
        next.output = reason;
        return Promise.resolve(createResult(ctx, next));
      };

      next.reject = function (error) {
        next.status = REJECTED;
        next.output = error;
        return Promise.reject(createResult(ctx, next));
      };

      next.status = RUNNING;

      return next();
    }
  }]);

  return Pipeline;
})();

exports.Pipeline = Pipeline;