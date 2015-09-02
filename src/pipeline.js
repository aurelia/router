import 'core-js';

function createResult(ctx, next) {
  return {
    status: next.status,
    context: ctx,
    output: next.output,
    completed: next.status === pipelineStatus.completed
  };
}

export const pipelineStatus = {
  completed: 'completed',
  canceled: 'canceled',
  rejected: 'rejected',
  running: 'running'
};

interface PipelineStep {
  run(context: Object, next: Function): void;
}

export class Pipeline {
  steps: Array<Function|PipelineStep> = [];

  withStep(step) {
    let run;

    if (typeof step === 'function') {
      run = step;
    } else if (step.isMultiStep) {
      let steps = step.getSteps();
      for (let i = 0, l = steps.length; i < l; i++) {
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
    let index = -1;
    let steps = this.steps;

    function next() {
      index++;

      if (index < steps.length) {
        let currentStep = steps[index];

        try {
          return currentStep(ctx, next);
        } catch(e) {
          return next.reject(e);
        }
      } else {
        return next.complete();
      }
    }

    next.complete = (output) => {
      next.status = pipelineStatus.completed;
      next.output = output;
      return Promise.resolve(createResult(ctx, next));
    };

    next.cancel = (reason) => {
      next.status = pipelineStatus.canceled;
      next.output = reason;
      return Promise.resolve(createResult(ctx, next));
    };

    next.reject = (error) => {
      next.status = pipelineStatus.rejected;
      next.output = error;
      return Promise.resolve(createResult(ctx, next));
    };

    next.status = pipelineStatus.running;

    return next();
  }
}
