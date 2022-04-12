import { PipelineStep, PipelineResult, StepRunnerFunction, IPipelineSlot } from './interfaces';
import { NavigationInstruction } from './navigation-instruction';
import { createNextFn } from './next';

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
    let run;

    if (typeof step === 'function') {
      run = step;
    } else if (typeof step.getSteps === 'function') {
      // getSteps is to enable support open slots
      // where devs can add multiple steps into the same slot name
      let steps = step.getSteps();
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
    const nextFn = createNextFn(instruction, this.steps);
    return nextFn();
  }
}
