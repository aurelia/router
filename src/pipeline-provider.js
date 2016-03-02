import {Container} from 'aurelia-dependency-injection';
import {Pipeline} from './pipeline';
import {BuildNavigationPlanStep} from './navigation-plan';
import {LoadRouteStep} from './route-loading';
import {CommitChangesStep} from './navigation-instruction';
import {
  CanDeactivatePreviousStep,
  CanActivateNextStep,
  DeactivatePreviousStep,
  ActivateNextStep
} from './activation';

/**
* Class responsible for creating the navigation pipeline.
*/
export class PipelineProvider {
  static inject() { return [Container]; }

  constructor(container: Container) {
    this.container = container;
    this.steps = [
      BuildNavigationPlanStep,
      CanDeactivatePreviousStep, //optional
      LoadRouteStep,
      this._createPipelineSlot('authorize'),
      CanActivateNextStep, //optional
      this._createPipelineSlot('preActivate', 'modelbind'),
      //NOTE: app state changes start below - point of no return
      DeactivatePreviousStep, //optional
      ActivateNextStep, //optional
      this._createPipelineSlot('preRender', 'precommit'),
      CommitChangesStep,
      this._createPipelineSlot('postRender', 'postcomplete')
    ];
  }

  /**
  * Create the navigation pipeline.
  */
  createPipeline(): Pipeline {
    let pipeline = new Pipeline();
    this.steps.forEach(step => pipeline.addStep(this.container.get(step)));
    return pipeline;
  }

  /**
  * Adds a step into the pipeline at a known slot location.
  */
  addStep(name: string, step: PipelineStep): void {
    let found = this.steps.find(x => x.slotName === name || x.slotAlias === name);
    if (found) {
      found.steps.push(step);
    } else {
      throw new Error(`Invalid pipeline slot name: ${name}.`);
    }
  }

  _createPipelineSlot(name, alias) {
    class PipelineSlot {
      static inject = [Container];
      static slotName = name;
      static slotAlias = alias;
      static steps = [];

      constructor(container) {
        this.container = container;
      }

      getSteps() {
        return PipelineSlot.steps.map(x => this.container.get(x));
      }
    }

    return PipelineSlot;
  }
}
