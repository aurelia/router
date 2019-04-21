import { Container } from 'aurelia-dependency-injection';
import { Pipeline } from './pipeline';
import { BuildNavigationPlanStep } from './step-build-navigation-plan';
import { LoadRouteStep } from './step-load-route';
import { CommitChangesStep } from './step-commit-changes';
import { CanDeactivatePreviousStep, CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep } from './step-activation';
import { PipelineStep, StepRunnerFunction, IPipelineSlot } from './interfaces';
import { PipelineSlotName } from './pipeline-slot-name';

/**
 * A multi-slots Pipeline Placeholder Step for hooking into a pipeline execution
 */
class PipelineSlot implements IPipelineSlot {

  /**@internal */
  container: Container;
  /**@internal */
  slotName: string;
  /**@internal */
  slotAlias?: string;

  steps: (Function | PipelineStep)[];

  constructor(container: Container, name: string, alias?: string) {
    this.container = container;
    this.slotName = name;
    this.slotAlias = alias;
    this.steps = [];
  }

  getSteps(): (StepRunnerFunction | IPipelineSlot | PipelineStep)[] {
    return this.steps.map(x => this.container.get(x));
  }
}

/**
 * Class responsible for creating the navigation pipeline.
 */
export class PipelineProvider {

  /**@internal */
  static inject() { return [Container]; }
  /**@internal */
  container: Container;
  /**@internal */
  steps: (Function | PipelineSlot)[];

  constructor(container: Container) {
    this.container = container;
    this.steps = [
      BuildNavigationPlanStep,
      CanDeactivatePreviousStep, // optional
      LoadRouteStep,
      createPipelineSlot(container, PipelineSlotName.Authorize),
      CanActivateNextStep, // optional
      createPipelineSlot(container, PipelineSlotName.PreActivate, 'modelbind'),
      // NOTE: app state changes start below - point of no return
      DeactivatePreviousStep, // optional
      ActivateNextStep, // optional
      createPipelineSlot(container, PipelineSlotName.PreRender, 'precommit'),
      CommitChangesStep,
      createPipelineSlot(container, PipelineSlotName.PostRender, 'postcomplete')
    ];
  }

  /**
   * Create the navigation pipeline.
   */
  createPipeline(useCanDeactivateStep: boolean = true): Pipeline {
    let pipeline = new Pipeline();
    this.steps.forEach(step => {
      if (useCanDeactivateStep || step !== CanDeactivatePreviousStep) {
        pipeline.addStep(this.container.get(step));
      }
    });
    return pipeline;
  }

  /**@internal */
  _findStep(name: string): PipelineSlot {
    // Steps that are not PipelineSlots are constructor functions, and they will automatically fail. Probably.
    return this.steps.find(x => (x as PipelineSlot).slotName === name || (x as PipelineSlot).slotAlias === name) as PipelineSlot;
  }

  /**
   * Adds a step into the pipeline at a known slot location.
   */
  addStep(name: string, step: PipelineStep | Function): void {
    let found = this._findStep(name);
    if (found) {
      let slotSteps = found.steps;
      // prevent duplicates
      if (!slotSteps.includes(step)) {
        slotSteps.push(step);
      }
    } else {
      throw new Error(`Invalid pipeline slot name: ${name}.`);
    }
  }

  /**
   * Removes a step from a slot in the pipeline
   */
  removeStep(name: string, step: PipelineStep): void {
    let slot = this._findStep(name);
    if (slot) {
      let slotSteps = slot.steps;
      slotSteps.splice(slotSteps.indexOf(step), 1);
    }
  }

  /**
   * Clears all steps from a slot in the pipeline
   * @internal
   */
  _clearSteps(name: string = ''): void {
    let slot = this._findStep(name);
    if (slot) {
      slot.steps = [];
    }
  }

  /**
   * Resets all pipeline slots
   */
  reset(): void {
    this._clearSteps(PipelineSlotName.Authorize);
    this._clearSteps(PipelineSlotName.PreActivate);
    this._clearSteps(PipelineSlotName.PreRender);
    this._clearSteps(PipelineSlotName.PostRender);
  }
}

/**@internal */
const createPipelineSlot = (container: Container, name: PipelineSlotName, alias?: string): PipelineSlot => {
  return new PipelineSlot(container, name, alias);
};
