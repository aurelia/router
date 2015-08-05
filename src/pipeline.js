import * as core from 'core-js';

function createResult(ctx, next) {
  return {
    status: next.status,
    context: ctx,
    output: next.output,
    completed: next.status == pipelineStatus.completed
  };
}

export const pipelineStatus = {
  completed: 'completed',
  cancelled: 'cancelled',
  rejected: 'rejected',
  running: 'running'
};

export class Pipeline {
  constructor() {
    this.steps = [];
  }

  withStep(step) {
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

  run(ctx) {
    var index = -1,
        steps = this.steps,
        next, currentStep;

    next = function() {
      index++;

      if (index < steps.length) {
        currentStep = steps[index];

        try {
          return currentStep(ctx, next);
        } catch(e) {
          return next.reject(e);
        }
      } else {
        return next.complete();
      }
    };

    next.complete = output => {
      next.status = pipelineStatus.completed;
      next.output = output;
      return Promise.resolve(createResult(ctx, next));
    };

    next.cancel = reason => {
      next.status = pipelineStatus.cancelled;
      next.output = reason;
      return Promise.resolve(createResult(ctx, next));
    };

    next.reject = error => {
      next.status = pipelineStatus.rejected;
      next.output = error;
      return Promise.resolve(createResult(ctx, next));
    };

    next.status = pipelineStatus.running;

    return next();
  }
}
