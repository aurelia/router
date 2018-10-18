import { PipelineStep, PipelineResult } from './interfaces';
import { NavigationInstruction } from './navigation-instruction';

export interface PipeLineStatus {
  completed: 'completed';
  canceled: 'canceled';
  rejected: 'rejected';
  running: 'running';
}

export type PipeLineStatusType = PipeLineStatus[keyof PipeLineStatus];

/**
* The status of a Pipeline.
*/
export const pipelineStatus: PipeLineStatus = {
  completed: 'completed',
  canceled: 'canceled',
  rejected: 'rejected',
  running: 'running'
};

/**
* A callback to indicate when pipeline processing should advance to the next step
* or be aborted.
*/
export interface Next {
  /**
  * Indicates the successful completion of the pipeline step.
  */
  (): Promise<any>;
  /**
  * Indicates the successful completion of the entire pipeline.
  */
  complete: (result?: any) => Promise<any>;

  /**
  * Indicates that the pipeline should cancel processing.
  */
  cancel: (result?: any) => Promise<any>;

  /**
  * Indicates that pipeline processing has failed and should be stopped.
  */
  reject: (result?: any) => Promise<any>;
}

/**
* The class responsible for managing and processing the navigation pipeline.
*/
export class Pipeline {
  /**
  * The pipeline steps.
  */
  steps: Array<Function | PipelineStep> = [];

  /**
  * Adds a step to the pipeline.
  *
  * @param step The pipeline step.
  */
  addStep(step: PipelineStep): Pipeline {
    let run;

    if (typeof step === 'function') {
      run = step;
    } else if (typeof step.getSteps === 'function') {
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
  * @param instruction The navigation instruction to process.
  */
  run(instruction: NavigationInstruction): Promise<PipelineResult> {
    let index = -1;
    const steps = this.steps;

    const next: Next = function() {
      index++;

      if (index < steps.length) {
        let currentStep = steps[index];

        try {
          return (currentStep as Function)(instruction, next);
        } catch (e) {
          return next.reject(e);
        }
      } else {
        return next.complete();
      }
    } as Next;

    next.complete = createCompletionHandler(next, pipelineStatus.completed);
    next.cancel = createCompletionHandler(next, pipelineStatus.canceled);
    next.reject = createCompletionHandler(next, pipelineStatus.rejected);

    return next();
  }
}

function createCompletionHandler(next: Next, status: PipeLineStatusType) {
  return (output: any) => {
    return Promise.resolve({ status, output, completed: status === pipelineStatus.completed });
  };
}
