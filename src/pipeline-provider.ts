import { Container } from 'aurelia-dependency-injection';
import { Pipeline } from './pipeline';
import { BuildNavigationPlanStep } from './navigation-plan';
import { LoadRouteStep } from './route-loading';
import { CommitChangesStep } from './navigation-instruction';
import {
  CanDeactivatePreviousStep,
  CanActivateNextStep,
  DeactivatePreviousStep,
  ActivateNextStep
} from './activation';
import { PipelineStep, IPipelineSlot, Constructable, StepRunnerFunction } from './interfaces';

/**@internal exported for unit testing */
// Constant enum to reduce amount of code generated
export const enum SlottableStep {
  authorize = 'authorize',
  preActivate = 'preActivate',
  preRender = 'preRender',
  postRender = 'postRender',
  // following are deliberately named in such way
  // probably we will want to remove the alias in future
  // as they are not as useful as expected
  preActivate__or__modelbind = 'modelbind',
  preRender__or__precommit = 'precommit',
  postRender__or__postcomplete = 'postcomplete'
}

/**@internal exported for unit testing */
export class PipelineSlot implements IPipelineSlot {

  /**@internal */
  container: Container;
  /**@internal */
  slotName: string;
  /**@internal */
  slotAlias?: string;

  steps: (Function | PipelineStep)[] = [];

  constructor(container: Container, name: string, alias?: string) {
    this.container = container;
    this.slotName = name;
    this.slotAlias = alias;
  }

  getSteps(): (StepRunnerFunction | IPipelineSlot | PipelineStep)[] {
    return this.steps.map(x => this.container.get(x));
  }
}

/**
* Class responsible for creating the navigation pipeline.
*/
export class PipelineProvider {

  static inject() { return [Container]; }
  /**@internal */
  container: Container;
  /**@internal */
  steps: (Constructable<PipelineStep> | PipelineSlot)[];

  constructor(container: Container) {
    this.container = container;
    this._buildSteps();
  }

  /**@internal */
  _buildSteps() {
    this.steps = [
      BuildNavigationPlanStep,
      CanDeactivatePreviousStep, // optional
      LoadRouteStep,
      // adding alias with the same name to prevent error where user pass in an undefined in addStep
      this._createPipelineSlot(SlottableStep.authorize, SlottableStep.authorize),
      CanActivateNextStep, // optional
      this._createPipelineSlot(SlottableStep.preActivate, SlottableStep.preActivate__or__modelbind),
      // NOTE: app state changes start below - point of no return
      DeactivatePreviousStep, // optional
      ActivateNextStep, // optional
      this._createPipelineSlot(SlottableStep.preRender, SlottableStep.preRender__or__precommit),
      CommitChangesStep,
      this._createPipelineSlot(SlottableStep.postRender, SlottableStep.postRender__or__postcomplete)
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
    // A change compared to v1. (typeof x === 'object') Making it safer to find PipelineSlot
    // As it avoids accidental hook when a step constructor has either static property slotName or slotAlias
    return this.steps.find(x => typeof x === 'object' && (x.slotName === name || x.slotAlias === name)) as PipelineSlot;
  }

  /**
  * Adds a step into the pipeline at a known slot location.
  */
  addStep(name: string, step: PipelineStep | Function): void {
    let found = this._findStep(name);
    if (found) {
      if (!found.steps.includes(step)) { // prevent duplicates
        found.steps.push(step);
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
      slot.steps.splice(slot.steps.indexOf(step), 1);
    }
  }

  /**
   * @internal
   * Clears all steps from a slot in the pipeline
   */
  _clearSteps(name: string): void {
    let slot = this._findStep(name);
    if (slot) {
      slot.steps = [];
    }
  }

  /**
   * Resets all pipeline slots
   */
  reset(): void {
    this._clearSteps(SlottableStep.authorize);
    this._clearSteps(SlottableStep.preActivate);
    this._clearSteps(SlottableStep.preRender);
    this._clearSteps(SlottableStep.postRender);
  }

  /**@internal */
  _createPipelineSlot(name: string, alias?: string): PipelineSlot {
    return new PipelineSlot(this.container, name, alias);
  }
}
