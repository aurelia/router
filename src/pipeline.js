import 'core-js';

/**
* The status of a Pipeline.
*/
export const pipelineStatus = {
  completed: 'completed',
  canceled: 'canceled',
  rejected: 'rejected',
  running: 'running'
};

/**
* A step to be run during processing of the pipeline.
*/
interface PipelineStep {
  /**
   * Execute the pipeline step. The step should invoke next(), next.complete(),
   * next.cancel(), or next.reject() to allow the pipeline to continue.
   *
   * @param context The navigation context.
   * @param next The next step in the pipeline.
   */
  run(context: NavigationContext, next: Function): void;
}

/**
* The result of a pipeline run.
*/
interface PipelineResult {
  status: string;
  context: NavigationContext;
  output: any;
  completed: boolean;
}

/**
* The class responsible for managing and processing the navigation pipeline.
*/
export class Pipeline {
  /**
  * The pipeline steps.
  */
  steps: Array<Function|PipelineStep> = [];

  /**
  * Adds a step to the pipeline.
  *
  * @param step The pipeline step.
  */
  addStep(step: PipelineStep): Pipeline {
    let run;

    if (typeof step === 'function') {
      run = step;
    } else if (step.isMultiStep) {
      let steps = step.getSteps();
      for (let i = 0, l = steps.length; i < l; i++) {
        this.addStep(steps[i]);
      }

      return this;
    } else {
      run = step.run.bind(step);
    }

    this.steps.push(run);

    return this;
  }

  /**
  * Runs the pipeline.
  *
  * @param context The navigation context to process.
  */
  run(context: NavigationContext): Promise<PipelineResult> {
    let index = -1;
    let steps = this.steps;

    function next() {
      index++;

      if (index < steps.length) {
        let currentStep = steps[index];

        try {
          return currentStep(context, next);
        } catch (e) {
          return next.reject(e);
        }
      } else {
        return next.complete();
      }
    }

    next.complete = (output) => {
      next.status = pipelineStatus.completed;
      next.output = output;
      return Promise.resolve(createResult(context, next));
    };

    next.cancel = (reason) => {
      next.status = pipelineStatus.canceled;
      next.output = reason;
      return Promise.resolve(createResult(context, next));
    };

    next.reject = (error) => {
      next.status = pipelineStatus.rejected;
      next.output = error;
      return Promise.resolve(createResult(context, next));
    };

    next.status = pipelineStatus.running;

    return next();
  }
}

function createResult(context, next) {
  return {
    status: next.status,
    context: context,
    output: next.output,
    completed: next.status === pipelineStatus.completed
  };
}
