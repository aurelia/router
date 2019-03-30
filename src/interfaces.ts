import { Container } from 'aurelia-dependency-injection';
import { NavigationInstruction } from './navigation-instruction';
import { Router } from './router';
import { NavModel } from './nav-model';
import { RouterConfiguration } from './router-configuration';
import { NavigationCommand } from './navigation-commands';
import { IObservable } from './activation';
import { PipelineStatus } from './pipeline-status';

/**@internal */
declare module 'aurelia-dependency-injection' {
  interface Container {
    getChildRouter?: () => Router;
  }
}

/**
 * A configuration object that describes a route for redirection
 */
export interface RedirectConfig {
  /**
   * path that will be redirected to. This is relative to currently in process router
   */
  redirect: string;
}

/**
 * A more generic RouteConfig for unknown route. Either a redirect config or a `RouteConfig`
 * Redirect config is generally used in `mapUnknownRoutes` of `RouterConfiguration`
 */
export type RouteOrRedirectConfig = RouteConfig | RedirectConfig;

/**
 * A RouteConfig specifier. Could be a string, or an object with `RouteConfig` interface shape,
 * or could be an object with redirect interface shape
 */
export type RouteConfigSpecifier =
  string
  | RouteOrRedirectConfig
  | ((instruction: NavigationInstruction) => string | RouteOrRedirectConfig | Promise<string | RouteOrRedirectConfig>);

/**
* A configuration object that describes a route.
*/
export interface RouteConfig {
  /**
  * The route pattern to match against incoming URL fragments, or an array of patterns.
  */
  route: string | string[];

  /**
  * A unique name for the route that may be used to identify the route when generating URL fragments.
  * Required when this route should support URL generation, such as with [[Router.generate]] or
  * the route-href custom attribute.
  */
  name?: string;

  /**
  * The moduleId of the view model that should be activated for this route.
  */
  moduleId?: string;

  /**
  * A URL fragment to redirect to when this route is matched.
  */
  redirect?: string;

  /**
  * A function that can be used to dynamically select the module or modules to activate.
  * The function is passed the current [[NavigationInstruction]], and should configure
  * instruction.config with the desired moduleId, viewPorts, or redirect.
  */
  navigationStrategy?: (instruction: NavigationInstruction) => Promise<void> | void;

  /**
  * The view ports to target when activating this route. If unspecified, the target moduleId is loaded
  * into the default viewPort (the viewPort with name 'default'). The viewPorts object should have keys
  * whose property names correspond to names used by <router-view> elements. The values should be objects
  * specifying the moduleId to load into that viewPort.  The values may optionally include properties related to layout:
  * `layoutView`, `layoutViewModel` and `layoutModel`.
  */
  viewPorts?: any;

  /**
  * When specified, this route will be included in the [[Router.navigation]] nav model. Useful for
  * dynamically generating menus or other navigation elements. When a number is specified, that value
  * will be used as a sort order.
  */
  nav?: boolean | number;

  /**
  * The URL fragment to use in nav models. If unspecified, the [[RouteConfig.route]] will be used.
  * However, if the [[RouteConfig.route]] contains dynamic segments, this property must be specified.
  */
  href?: string;

  /**
  * Indicates that when route generation is done for this route, it should just take the literal value of the href property.
  */
  generationUsesHref?: boolean;

  /**
  * The document title to set when this route is active.
  */
  title?: string;

  /**
  * Arbitrary data to attach to the route. This can be used to attached custom data needed by components
  * like pipeline steps and activated modules.
  */
  settings?: any;

  /**
  * The navigation model for storing and interacting with the route's navigation settings.
  */
  navModel?: NavModel;

  /**
  * When true is specified, this route will be case sensitive.
  */
  caseSensitive?: boolean;

  /**
  * Add to specify an activation strategy if it is always the same and you do not want that
  * to be in your view-model code. Available values are 'replace' and 'invoke-lifecycle'.
  */
  activationStrategy?: ActivationStrategyType;

  /**
   * specifies the file name of a layout view to use.
   */
  layoutView?: string;

  /**
   * specifies the moduleId of the view model to use with the layout view.
   */
  layoutViewModel?: string;

  /**
   * specifies the model parameter to pass to the layout view model's `activate` function.
   */
  layoutModel?: any;

  [x: string]: any;
}

/**
* An optional interface describing the canActivate convention.
*/
export interface RoutableComponentCanActivate {
  /**
  * Implement this hook if you want to control whether or not your view-model can be navigated to.
  * Return a boolean value, a promise for a boolean value, or a navigation command.
  */
  canActivate(
    params: any,
    routeConfig: RouteConfig,
    navigationInstruction: NavigationInstruction
  ): boolean | Promise<boolean> | PromiseLike<boolean> | NavigationCommand | Promise<NavigationCommand> | PromiseLike<NavigationCommand>;
}

/**
* An optional interface describing the activate convention.
*/
export interface RoutableComponentActivate {
  /**
  * Implement this hook if you want to perform custom logic just before your view-model is displayed.
  * You can optionally return a promise to tell the router to wait to bind and attach the view until
  * after you finish your work.
  */
  activate(params: any, routeConfig: RouteConfig, navigationInstruction: NavigationInstruction): Promise<void> | PromiseLike<void> | IObservable | void;
}

/**
* An optional interface describing the canDeactivate convention.
*/
export interface RoutableComponentCanDeactivate {
  /**
  * Implement this hook if you want to control whether or not the router can navigate away from your
  * view-model when moving to a new route. Return a boolean value, a promise for a boolean value,
  * or a navigation command.
  */
  canDeactivate: () => boolean | Promise<boolean> | PromiseLike<boolean> | NavigationCommand;
}

/**
* An optional interface describing the deactivate convention.
*/
export interface RoutableComponentDeactivate {
  /**
  * Implement this hook if you want to perform custom logic when your view-model is being
  * navigated away from. You can optionally return a promise to tell the router to wait until
  * after you finish your work.
  */
  deactivate: () => Promise<void> | PromiseLike<void> | IObservable | void;
}

/**
* An optional interface describing the determineActivationStrategy convention.
*/
export interface RoutableComponentDetermineActivationStrategy {
  /**
  * Implement this hook if you want to give hints to the router about the activation strategy, when reusing
  * a view model for different routes. Available values are 'replace' and 'invoke-lifecycle'.
  */
  determineActivationStrategy(params: any, routeConfig: RouteConfig, navigationInstruction: NavigationInstruction): ActivationStrategyType;
}

/**
* An optional interface describing the router configuration convention.
*/
export interface ConfiguresRouter {
  /**
  * Implement this hook if you want to configure a router.
  */
  configureRouter(config: RouterConfiguration, router: Router): Promise<void> | PromiseLike<void> | void;
}

/**
* An optional interface describing the available activation strategies.
*/
export interface ActivationStrategy {
  /**
  * Reuse the existing view model, without invoking Router lifecycle hooks.
  */
  noChange: 'no-change';
  /**
  * Reuse the existing view model, invoking Router lifecycle hooks.
  */
  invokeLifecycle: 'invoke-lifecycle';
  /**
  * Replace the existing view model, invoking Router lifecycle hooks.
  */
  replace: 'replace';
}

export type ActivationStrategyType = ActivationStrategy[keyof ActivationStrategy];

/**
* A step to be run during processing of the pipeline.
*/
export interface PipelineStep {
  /**
   * Execute the pipeline step. The step should invoke next(), next.complete(),
   * next.cancel(), or next.reject() to allow the pipeline to continue.
   *
   * @param instruction The navigation instruction.
   * @param next The next step in the pipeline.
   */
  run(instruction: NavigationInstruction, next: Next): Promise<any>;

  /**
   * @internal
   */
  getSteps?(): any[];
}

/**
 * A multi-step pipeline step that helps enable multiple hooks to the pipeline
 */
export interface IPipelineSlot {
  /**@internal */
  getSteps(): (StepRunnerFunction | IPipelineSlot | PipelineStep)[];
}

/**
* The result of a pipeline run.
*/
export interface PipelineResult {
  status: string;
  instruction: NavigationInstruction;
  output: any;
  completed: boolean;
}

/**
 * The component responsible for routing
 */
export interface ViewPortComponent {
  viewModel: any;
  childContainer?: Container;
  router: Router;
  config?: RouteConfig;
  childRouter?: Router;
  /**
   * This is for backward compat, when moving from any to a more strongly typed interface
   */
  [key: string]: any;
}

export interface ViewPort {
  /**@internal */
  container: Container;
  swap(viewportInstruction: ViewPortInstruction): void;
  process(viewportInstruction: ViewPortInstruction, waitToSwap?: boolean): Promise<void>;
}

export interface ViewPortPlan {
  name: string;
  config: RouteConfig;
  strategy: ActivationStrategyType;

  prevComponent?: ViewPortComponent;
  prevModuleId?: string;
  childNavigationInstruction?: NavigationInstruction;
}

export interface ViewPortInstruction {

  name?: string;

  strategy: ActivationStrategyType;

  childNavigationInstruction?: NavigationInstruction;

  moduleId: string;

  component: ViewPortComponent;

  childRouter?: Router;

  lifecycleArgs: LifecycleArguments;

  prevComponent?: ViewPortComponent;
}

export type NavigationResult = boolean | Promise<PipelineResult | boolean>;

export type LifecycleArguments = [Record<string, string>, RouteConfig, NavigationInstruction];

/**
* A callback to indicate when pipeline processing should advance to the next step
* or be aborted.
*/
export interface Next<T = any> {
  /**
  * Indicates the successful completion of the pipeline step.
  */
  (): Promise<any>;
  /**
  * Indicates the successful completion of the entire pipeline.
  */
  complete: NextCompletionHandler<T>;

  /**
  * Indicates that the pipeline should cancel processing.
  */
  cancel: NextCompletionHandler<T>;

  /**
  * Indicates that pipeline processing has failed and should be stopped.
  */
  reject: NextCompletionHandler<T>;
}

/**
 * Next Completion result. Comprises of final status, output (could be value/error) and flag `completed`
 */
export interface NextCompletionResult<T = any> {
  status: PipelineStatus;
  output: T;
  completed: boolean;
}

/**
 * Handler for resolving `NextCompletionResult`
 */
export type NextCompletionHandler<T = any> = (output?: T) => Promise<NextCompletionResult<T>>;

export type StepRunnerFunction = <TThis = any>(this: TThis, instruction: NavigationInstruction, next: Next) => any;
