import {Container} from 'aurelia-dependency-injection';
import {Pipeline} from './pipeline';
import {BuildNavigationPlanStep} from './navigation-plan';
import {LoadRouteStep} from './route-loading';
import {CommitChangesStep} from './navigation-context';
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
      createRouteFilterStep('authorize'),
      createRouteFilterStep('modelbind'),
      CanActivateNextStep, //optional
      //NOTE: app state changes start below - point of no return
      DeactivatePreviousStep, //optional
      ActivateNextStep, //optional
      createRouteFilterStep('precommit'),
      CommitChangesStep,
      createRouteFilterStep('postcomplete')
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
