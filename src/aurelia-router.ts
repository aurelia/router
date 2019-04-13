export {
  RoutableComponentCanActivate,
  RoutableComponentActivate,
  RoutableComponentCanDeactivate,
  RoutableComponentDeactivate,
  RoutableComponentDetermineActivationStrategy,
  ConfiguresRouter,
  RouteConfig,
  NavigationResult,
  Next,
  PipelineResult,
  PipelineStep
  // following are excluded and wait for more proper chance to be introduced for stronger typings story
  // this is to avoid any typings issue for a long delayed release
  /**
   * ViewPort
   * ViewPortPlan
   * ViewPortInstruction
   * ViewPortComponent
   */
} from './interfaces';
export {
  IObservable,
  IObservableConfig
} from './utilities-activation';
export { AppRouter } from './app-router';
export { NavModel } from './nav-model';
export { Redirect, RedirectToRoute, NavigationCommand, isNavigationCommand } from './navigation-commands';

export {
  NavigationInstruction,
  NavigationInstructionInit
} from './navigation-instruction';

export {
  ActivateNextStep,
  CanActivateNextStep,
  CanDeactivatePreviousStep,
  DeactivatePreviousStep
} from './step-activation';

export { CommitChangesStep } from './step-commit-changes';
export { BuildNavigationPlanStep } from './step-build-navigation-plan';
export { LoadRouteStep } from './step-load-route';

export {
  ActivationStrategy,
  activationStrategy
} from './activation-strategy';

export {
  PipelineStatus
} from './pipeline-status';

export {
  RouterEvent
} from './router-event';

export {
  PipelineSlotName
} from './pipeline-slot-name';

export { PipelineProvider } from './pipeline-provider';
export { Pipeline } from './pipeline';
export { RouteLoader } from './utilities-route-loading';
export { RouterConfiguration } from './router-configuration';
export { Router } from './router';
