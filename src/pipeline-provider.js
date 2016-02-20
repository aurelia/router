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
import {createRouteFilterStep} from './route-filters';

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
      createRouteFilterStep(pipelineSlot.authorize),
      CanActivateNextStep, //optional
      createRouteFilterStep(pipelineSlot.preActivate, { aliases: ['modelbind']}),
      //NOTE: app state changes start below - point of no return
      DeactivatePreviousStep, //optional
      ActivateNextStep, //optional
      createRouteFilterStep(pipelineSlot.preRender, { aliases: ['precommit']}),
      CommitChangesStep,
      createRouteFilterStep(pipelineSlot.postRender, { aliases: ['postcomplete']})
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
}

const pipelineSlot = {
  authorize: 'authorize',
  preActivate: 'preActivate',
  preRender: 'preRender',
  postRender: 'postRender'
};
