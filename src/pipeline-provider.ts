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
import { PipelineStep } from './interfaces';


class PipelineSlot {

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

  getSteps(): PipelineStep[] {
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
  steps: (Function | PipelineSlot)[];

  constructor(container: Container) {
    this.container = container;
    this.steps = [
      BuildNavigationPlanStep,
      CanDeactivatePreviousStep, // optional
      LoadRouteStep,
      this._createPipelineSlot('authorize'),
      CanActivateNextStep, // optional
      this._createPipelineSlot('preActivate', 'modelbind'),
      // NOTE: app state changes start below - point of no return
      DeactivatePreviousStep, // optional
      ActivateNextStep, // optional
      this._createPipelineSlot('preRender', 'precommit'),
      CommitChangesStep,
      this._createPipelineSlot('postRender', 'postcomplete')
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
    this._clearSteps('authorize');
    this._clearSteps('preActivate');
    this._clearSteps('preRender');
    this._clearSteps('postRender');
  }

  /**@internal */
  _createPipelineSlot(name: string, alias?: string): PipelineSlot {
    return new PipelineSlot(this.container, name, alias);
  }
}
