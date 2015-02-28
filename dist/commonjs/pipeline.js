"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

function createResult(ctx, next) {
  return {
    status: next.status,
    context: ctx,
    output: next.output,
    completed: next.status == COMPLETED
  };
}

var COMPLETED = exports.COMPLETED = "completed";
var CANCELLED = exports.CANCELLED = "cancelled";
var REJECTED = exports.REJECTED = "rejected";
var RUNNING = exports.RUNNING = "running";

var Pipeline = exports.Pipeline = (function () {
  function Pipeline() {
    _classCallCheck(this, Pipeline);

    this.steps = [];
  }

  _prototypeProperties(Pipeline, null, {
    withStep: {
      value: function withStep(step) {
        var run, steps, i, l;

        if (typeof step == "function") {
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
      },
      writable: true,
      configurable: true
    },
    run: {
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
      },
      writable: true,
      configurable: true
    }
  });

  return Pipeline;
})();

Object.defineProperty(exports, "__esModule", {
  value: true
});