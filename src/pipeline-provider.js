import {Container} from 'aurelia-dependency-injection';
import {Pipeline} from './pipeline';
import {BuildNavigationPlanStep} from './navigation-plan';
import {ApplyModelBindersStep} from './model-binding';
import {LoadRouteStep} from './route-loading';
import {CommitChangesStep} from './navigation-context';
import {
  CanDeactivatePreviousStep,
  CanActivateNextStep,
  DeactivatePreviousStep,
  ActivateNextStep
} from './activation';

export class PipelineProvider {
  static inject(){ return [Container]; }
  constructor(container){
    this.container = container;
    this.steps = [
      BuildNavigationPlanStep,
      CanDeactivatePreviousStep, //optional
      LoadRouteStep,
      ApplyModelBindersStep, //optional
      CanActivateNextStep, //optional
      //NOTE: app state changes start below - point of no return
      DeactivatePreviousStep, //optional
      ActivateNextStep, //optional
      CommitChangesStep
    ];
  }

  createPipeline(navigationContext) {
    var pipeline = new Pipeline();
    this.steps.forEach(step => pipeline.withStep(this.container.get(step)));
    return pipeline;
  }
}