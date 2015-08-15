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
import {NavigationContext} from './navigation-context';

export class PipelineProvider {
  static inject() {return [Container];}
  constructor(container : Container) {
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

  createPipeline(navigationContext : NavigationContext) : Pipeline {
    var pipeline = new Pipeline();
    this.steps.forEach(step => pipeline.withStep(this.container.get(step)));
    return pipeline;
  }
}
