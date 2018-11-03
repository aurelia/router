import { PipelineStep, PipelineResult, IPipelineSlot } from './interfaces';
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

export type StepRunnerFunction = <TThis = any>(this: TThis, instruction: NavigationInstruction, next: Next) => any;

/**
* The class responsible for managing and processing the navigation pipeline.
*/
export class Pipeline {
  /**
  * The pipeline steps. And steps added via addStep will be converted to a function
  * The actualy running functions with correct step contexts of this pipeline
  */
  steps: StepRunnerFunction[] = [];

  /**
  * Adds a step to the pipeline.
  *
  * @param step The pipeline step.
  */
  addStep(step: StepRunnerFunction | PipelineStep | IPipelineSlot): Pipeline {
    // This situation is a bit unfortunate where there is an implicit conversion of any incoming step to a fn
    let run: StepRunnerFunction;

    if (typeof step === 'function') {
      run = step;
    } else if (typeof (step as IPipelineSlot).getSteps === 'function') {
      // getSteps is to enable support open slots
      // where devs can add multiple steps into the same slot name
      let steps = (step as IPipelineSlot).getSteps();
      for (let i = 0, l = steps.length; i < l; i++) {
        this.addStep(steps[i]);
      }

      return this;
    } else {
      run = (step as PipelineStep).run.bind(step);
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
          return currentStep(instruction, next);
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

/**@internal exported for unit testing */
export function createCompletionHandler(next: Next, status: PipeLineStatusType) {
  return (output: any) => {
    return Promise.resolve({ status, output, completed: status === pipelineStatus.completed });
  };
}
