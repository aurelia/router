import { PipelineStep, PipelineResult, IPipelineSlot, StepRunnerFunction, Next } from './interfaces';
import { NavigationInstruction } from './navigation-instruction';
import { createNext } from './next';

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
    const next = createNext(instruction, this.steps);
    return next();
  }
}
