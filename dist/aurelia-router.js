import * as LogManager from 'aurelia-logging';
import {RouteRecognizer} from 'aurelia-route-recognizer';
import {Container} from 'aurelia-dependency-injection';
import {History,NavigationOptions} from 'aurelia-history';
import {EventAggregator} from 'aurelia-event-aggregator';

export function _normalizeAbsolutePath(path, hasPushState, absolute = false) {
  if (!hasPushState && path[0] !== '#') {
    path = '#' + path;
  }

  if (hasPushState && absolute) {
    path = path.substring(1, path.length);
  }

  return path;
}

export function _createRootedPath(fragment, baseUrl, hasPushState, absolute) {
  if (isAbsoluteUrl.test(fragment)) {
    return fragment;
  }

  let path = '';

  if (baseUrl.length && baseUrl[0] !== '/') {
    path += '/';
  }

  path += baseUrl;

  if ((!path.length || path[path.length - 1] !== '/') && fragment[0] !== '/') {
    path += '/';
  }

  if (path.length && path[path.length - 1] === '/' && fragment[0] === '/') {
    path = path.substring(0, path.length - 1);
  }

  return _normalizeAbsolutePath(path + fragment, hasPushState, absolute);
}

export function _resolveUrl(fragment, baseUrl, hasPushState) {
  if (isRootedPath.test(fragment)) {
    return _normalizeAbsolutePath(fragment, hasPushState);
  }

  return _createRootedPath(fragment, baseUrl, hasPushState);
}

export function _ensureArrayWithSingleRoutePerConfig(config) {
  let routeConfigs = [];

  if (Array.isArray(config.route)) {
    for (let i = 0, ii = config.route.length; i < ii; ++i) {
      let current = Object.assign({}, config);
      current.route = config.route[i];
      routeConfigs.push(current);
    }
  } else {
    routeConfigs.push(Object.assign({}, config));
  }

  return routeConfigs;
}

const isRootedPath = /^#?\//;
const isAbsoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;

interface NavigationInstructionInit {
  fragment: string,
  queryString: string,
  params : Object,
  queryParams: Object,
  config: RouteConfig,
  parentInstruction: NavigationInstruction,
  previousInstruction: NavigationInstruction,
  router: Router,
  options: Object
}

export class CommitChangesStep {
  run(navigationInstruction: NavigationInstruction, next: Function) {
    return navigationInstruction._commitChanges(true).then(() => {
      navigationInstruction._updateTitle();
      return next();
    });
  }
}

/**
* Class used to represent an instruction during a navigation.
*/
export class NavigationInstruction {
  /**
  * The URL fragment.
  */
  fragment: string;

  /**
  * The query string.
  */
  queryString: string;

  /**
  * Parameters extracted from the route pattern.
  */
  params: any;

  /**
  * Parameters extracted from the query string.
  */
  queryParams: any;

  /**
  * The route config for the route matching this instruction.
  */
  config: RouteConfig;

  /**
  * The parent instruction, if this instruction was created by a child router.
  */
  parentInstruction: NavigationInstruction;

  /**
  * The instruction being replaced by this instruction in the current router.
  */
  previousInstruction: NavigationInstruction;

  /**
  * viewPort instructions to used activation.
  */
  viewPortInstructions: any;

  /**
    * The router instance.
  */
  router: Router;

  plan: Object = null;

  options: Object = {};

  constructor(init: NavigationInstructionInit) {
    Object.assign(this, init);

    this.params = this.params || {};
    this.viewPortInstructions = {};

    let ancestorParams = [];
    let current = this;
    do {
      let currentParams = Object.assign({}, current.params);
      if (current.config && current.config.hasChildRouter) {
        // remove the param for the injected child route segment
        delete currentParams[current.getWildCardName()];
      }

      ancestorParams.unshift(currentParams);
      current = current.parentInstruction;
    } while (current);

    let allParams = Object.assign({}, this.queryParams, ...ancestorParams);
    this.lifecycleArgs = [allParams, this.config, this];
  }

  /**
  * Gets an array containing this instruction and all child instructions for the current navigation.
  */
  getAllInstructions(): Array<NavigationInstruction> {
    let instructions = [this];
    for (let key in this.viewPortInstructions) {
      let childInstruction = this.viewPortInstructions[key].childNavigationInstruction;
      if (childInstruction) {
        instructions.push(...childInstruction.getAllInstructions());
      }
    }

    return instructions;
  }

  /**
  * Gets an array containing the instruction and all child instructions for the previous navigation.
  * Previous instructions are no longer available after navigation completes.
  */
  getAllPreviousInstructions(): Array<NavigationInstruction> {
    return this.getAllInstructions().map(c => c.previousInstruction).filter(c => c);
  }

  /**
  * Adds a viewPort instruction.
  */
  addViewPortInstruction(viewPortName: string, strategy: string, moduleId: string, component: any): any {
    const config = Object.assign({}, this.lifecycleArgs[1], { currentViewPort: viewPortName });
    let viewportInstruction = this.viewPortInstructions[viewPortName] = {
      name: viewPortName,
      strategy: strategy,
      moduleId: moduleId,
      component: component,
      childRouter: component.childRouter,
      lifecycleArgs: [].concat(this.lifecycleArgs[0], config, this.lifecycleArgs[2])
    };

    return viewportInstruction;
  }

  /**
  * Gets the name of the route pattern's wildcard parameter, if applicable.
  */
  getWildCardName(): string {
    let wildcardIndex = this.config.route.lastIndexOf('*');
    return this.config.route.substr(wildcardIndex + 1);
  }

  /**
  * Gets the path and query string created by filling the route
  * pattern's wildcard parameter with the matching param.
  */
  getWildcardPath(): string {
    let wildcardName = this.getWildCardName();
    let path = this.params[wildcardName] || '';

    if (this.queryString) {
      path += '?' + this.queryString;
    }

    return path;
  }

  /**
  * Gets the instruction's base URL, accounting for wildcard route parameters.
  */
  getBaseUrl(): string {
    let fragment = decodeURI(this.fragment);

    if (fragment === '') {
      let nonEmptyRoute = this.router.routes.find(route => {
        return route.name === this.config.name &&
          route.route !== '';
      });
      if (nonEmptyRoute) {
        fragment = nonEmptyRoute.route;
      }
    }

    if (!this.params) {
      return encodeURI(fragment);
    }

    let wildcardName = this.getWildCardName();
    let path = this.params[wildcardName] || '';

    if (!path) {
      return encodeURI(fragment);
    }

    return encodeURI(fragment.substr(0, fragment.lastIndexOf(path)));
  }

  _commitChanges(waitToSwap: boolean) {
    let router = this.router;
    router.currentInstruction = this;

    if (this.previousInstruction) {
      this.previousInstruction.config.navModel.isActive = false;
    }

    this.config.navModel.isActive = true;

    router.refreshNavigation();

    let loads = [];
    let delaySwaps = [];

    for (let viewPortName in this.viewPortInstructions) {
      let viewPortInstruction = this.viewPortInstructions[viewPortName];
      let viewPort = router.viewPorts[viewPortName];

      if (!viewPort) {
        throw new Error(`There was no router-view found in the view for ${viewPortInstruction.moduleId}.`);
      }

      if (viewPortInstruction.strategy === activationStrategy.replace) {
        if (viewPortInstruction.childNavigationInstruction && viewPortInstruction.childNavigationInstruction.parentCatchHandler) {
          loads.push(viewPortInstruction.childNavigationInstruction._commitChanges(waitToSwap));
        } else {
          if (waitToSwap) {
            delaySwaps.push({viewPort, viewPortInstruction});
          }
          loads.push(viewPort.process(viewPortInstruction, waitToSwap).then((x) => {
            if (viewPortInstruction.childNavigationInstruction) {
              return viewPortInstruction.childNavigationInstruction._commitChanges(waitToSwap);
            }
          }));
        }
      } else {
        if (viewPortInstruction.childNavigationInstruction) {
          loads.push(viewPortInstruction.childNavigationInstruction._commitChanges(waitToSwap));
        }
      }
    }

    return Promise.all(loads).then(() => {
      delaySwaps.forEach(x => x.viewPort.swap(x.viewPortInstruction));
      return null;
    }).then(() => prune(this));
  }

  _updateTitle(): void {
    let title = this._buildTitle(this.router.titleSeparator);
    if (title) {
      this.router.history.setTitle(title);
    }
  }

  _buildTitle(separator: string = ' | '): string {
    let title = '';
    let childTitles = [];

    if (this.config.navModel.title) {
      title = this.router.transformTitle(this.config.navModel.title);
    }

    for (let viewPortName in this.viewPortInstructions) {
      let viewPortInstruction = this.viewPortInstructions[viewPortName];

      if (viewPortInstruction.childNavigationInstruction) {
        let childTitle = viewPortInstruction.childNavigationInstruction._buildTitle(separator);
        if (childTitle) {
          childTitles.push(childTitle);
        }
      }
    }

    if (childTitles.length) {
      title = childTitles.join(separator) + (title ? separator : '') + title;
    }

    if (this.router.title) {
      title += (title ? separator : '') + this.router.transformTitle(this.router.title);
    }

    return title;
  }
}

function prune(instruction) {
  instruction.previousInstruction = null;
  instruction.plan = null;
}

/**
* Class for storing and interacting with a route's navigation settings.
*/
export class NavModel {

  /**
  * True if this nav item is currently active.
  */
  isActive: boolean = false;

  /**
  * The title.
  */
  title: string = null;

  /**
  * This nav item's absolute href.
  */
  href: string = null;

  /**
  * This nav item's relative href.
  */
  relativeHref: string = null;

  /**
  * Data attached to the route at configuration time.
  */
  settings: any = {};

  /**
  * The route config.
  */
  config: RouteConfig = null;

  /**
  * The router associated with this navigation model.
  */
  router: Router;

  constructor(router: Router, relativeHref: string) {
    this.router = router;
    this.relativeHref = relativeHref;
  }

  /**
  * Sets the route's title and updates document.title.
  *  If the a navigation is in progress, the change will be applied
  *  to document.title when the navigation completes.
  *
  * @param title The new title.
  */
  setTitle(title: string): void {
    this.title = title;

    if (this.isActive) {
      this.router.updateTitle();
    }
  }
}

/**
* A configuration object that describes a route.
*/
interface RouteConfig {
  /**
  * The route pattern to match against incoming URL fragments, or an array of patterns.
  */
  route: string|string[];

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
  navigationStrategy?: (instruction: NavigationInstruction) => Promise<void>|void;

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
  nav?: boolean|number;

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
  activationStrategy?: 'no-change' | 'invoke-lifecycle'| 'replace';

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
interface RoutableComponentCanActivate {
  /**
  * Implement this hook if you want to control whether or not your view-model can be navigated to.
  * Return a boolean value, a promise for a boolean value, or a navigation command.
  */
  canActivate: (params: any, routeConfig: RouteConfig, navigationInstruction: NavigationInstruction) => boolean|Promise<boolean>|PromiseLike<boolean>|NavigationCommand|Promise<NavigationCommand>|PromiseLike<NavigationCommand>;
}

/**
* An optional interface describing the activate convention.
*/
interface RoutableComponentActivate {
  /**
  * Implement this hook if you want to perform custom logic just before your view-model is displayed.
  * You can optionally return a promise to tell the router to wait to bind and attach the view until
  * after you finish your work.
  */
  activate: (params: any, routeConfig: RouteConfig, navigationInstruction: NavigationInstruction) => Promise<void>|PromiseLike<void>|IObservable|void;
}

/**
* An optional interface describing the canDeactivate convention.
*/
interface RoutableComponentCanDeactivate {
  /**
  * Implement this hook if you want to control whether or not the router can navigate away from your
  * view-model when moving to a new route. Return a boolean value, a promise for a boolean value,
  * or a navigation command.
  */
  canDeactivate: () => boolean|Promise<boolean>|PromiseLike<boolean>|NavigationCommand;
}

/**
* An optional interface describing the deactivate convention.
*/
interface RoutableComponentDeactivate {
  /**
  * Implement this hook if you want to perform custom logic when your view-model is being
  * navigated away from. You can optionally return a promise to tell the router to wait until
  * after you finish your work.
  */
  deactivate: () => Promise<void>|PromiseLike<void>|IObservable|void;
}

/**
* An optional interface describing the determineActivationStrategy convention.
*/
interface RoutableComponentDetermineActivationStrategy {
  /**
  * Implement this hook if you want to give hints to the router about the activation strategy, when reusing
  * a view model for different routes. Available values are 'replace' and 'invoke-lifecycle'.
  */
  determineActivationStrategy: (params: any, routeConfig: RouteConfig, navigationInstruction: NavigationInstruction) => 'no-change' | 'invoke-lifecycle'| 'replace';
}

/**
* An optional interface describing the router configuration convention.
*/
interface ConfiguresRouter {
  /**
  * Implement this hook if you want to configure a router.
  */
  configureRouter(config: RouterConfiguration, router: Router): Promise<void>|PromiseLike<void>|void;
}

/**
* An optional interface describing the available activation strategies.
*/
interface ActivationStrategy {
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

/**
* A step to be run during processing of the pipeline.
*/
interface PipelineStep {
  /**
   * Execute the pipeline step. The step should invoke next(), next.complete(),
   * next.cancel(), or next.reject() to allow the pipeline to continue.
   *
   * @param instruction The navigation instruction.
   * @param next The next step in the pipeline.
   */
  run(instruction: NavigationInstruction, next: Next): Promise<any>;
}

/**
* The result of a pipeline run.
*/
interface PipelineResult {
  status: string;
  instruction: NavigationInstruction;
  output: any;
  completed: boolean;
}

/**
* When a navigation command is encountered, the current navigation
* will be cancelled and control will be passed to the navigation
* command so it can determine the correct action.
*/
interface NavigationCommand {
  navigate: (router: Router) => void;
}

/**
* Determines if the provided object is a navigation command.
* A navigation command is anything with a navigate method.
*
* @param obj The object to check.
*/
export function isNavigationCommand(obj: any): boolean {
  return obj && typeof obj.navigate === 'function';
}

/**
* Used during the activation lifecycle to cause a redirect.
*/
export class Redirect {
  /**
   * @param url The URL fragment to use as the navigation destination.
   * @param options The navigation options.
   */
  constructor(url: string, options: any = {}) {
    this.url = url;
    this.options = Object.assign({ trigger: true, replace: true }, options);
    this.shouldContinueProcessing = false;
  }

  /**
  * Called by the activation system to set the child router.
  *
  * @param router The router.
  */
  setRouter(router: Router): void {
    this.router = router;
  }

  /**
  * Called by the navigation pipeline to navigate.
  *
  * @param appRouter The router to be redirected.
  */
  navigate(appRouter: Router): void {
    let navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
    navigatingRouter.navigate(this.url, this.options);
  }
}

/**
* Used during the activation lifecycle to cause a redirect to a named route.
*/
export class RedirectToRoute {
  /**
   * @param route The name of the route.
   * @param params The parameters to be sent to the activation method.
   * @param options The options to use for navigation.
   */
  constructor(route: string, params: any = {}, options: any = {}) {
    this.route = route;
    this.params = params;
    this.options = Object.assign({ trigger: true, replace: true }, options);
    this.shouldContinueProcessing = false;
  }

  /**
  * Called by the activation system to set the child router.
  *
  * @param router The router.
  */
  setRouter(router: Router): void {
    this.router = router;
  }

  /**
  * Called by the navigation pipeline to navigate.
  *
  * @param appRouter The router to be redirected.
  */
  navigate(appRouter: Router): void {
    let navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
    navigatingRouter.navigateToRoute(this.route, this.params, this.options);
  }
}

/**
* The status of a Pipeline.
*/
export const pipelineStatus = {
  completed: 'completed',
  canceled: 'canceled',
  rejected: 'rejected',
  running: 'running'
};

/**
* A callback to indicate when pipeline processing should advance to the next step
* or be aborted.
*/
interface Next {
  /**
  * Indicates the successful completion of the pipeline step.
  */
  (): Promise<any>,

  /**
  * Indicates the successful completion of the entire pipeline.
  */
  complete: (result?: any) => Promise<any>,

  /**
  * Indicates that the pipeline should cancel processing.
  */
  cancel: (result?: any) => Promise<any>,

  /**
  * Indicates that pipeline processing has failed and should be stopped.
  */
  reject: (result?: any) => Promise<any>
}

/**
* The class responsible for managing and processing the navigation pipeline.
*/
export class Pipeline {
  /**
  * The pipeline steps.
  */
  steps: Array<Function | PipelineStep> = [];

  /**
  * Adds a step to the pipeline.
  *
  * @param step The pipeline step.
  */
  addStep(step: PipelineStep): Pipeline {
    let run;

    if (typeof step === 'function') {
      run = step;
    } else if (typeof step.getSteps === 'function') {
      let steps = step.getSteps();
      for (let i = 0, l = steps.length; i < l; i++) {
        this.addStep(steps[i]);
      }

      return this;
    } else {
      run = step.run.bind(step);
    }

    this.steps.push(run);

    return this;
  }

  /**
  * Runs the pipeline.
  *
  * @param instruction The navigation instruction to process.
  */
  run(instruction: NavigationInstruction): Promise<PipelineResult> {
    let index = -1;
    let steps = this.steps;

    function next() {
      index++;

      if (index < steps.length) {
        let currentStep = steps[index];

        try {
          return currentStep(instruction, next);
        } catch (e) {
          return next.reject(e);
        }
      } else {
        return next.complete();
      }
    }

    next.complete = createCompletionHandler(next, pipelineStatus.completed);
    next.cancel = createCompletionHandler(next, pipelineStatus.canceled);
    next.reject = createCompletionHandler(next, pipelineStatus.rejected);

    return next();
  }
}

function createCompletionHandler(next, status) {
  return (output) => {
    return Promise.resolve({ status, output, completed: status === pipelineStatus.completed });
  };
}

/**
 * Class used to configure a [[Router]] instance.
 *
 * @constructor
 */
export class RouterConfiguration {
  instructions: Array<(router: Router) => void> = [];
  options: {
    [key: string]: any;
    compareQueryParams?: boolean;
    root?: string;
    pushState?: boolean;
    hashChange?: boolean;
    silent?: boolean;
  } = {};
  pipelineSteps: Array<{name: string, step: Function|PipelineStep}> = [];
  title: string;
  titleSeparator: string;
  unknownRouteConfig: string|RouteConfig|((instruction: NavigationInstruction) => string|RouteConfig|Promise<string|RouteConfig>);
  viewPortDefaults: {[name: string]: {moduleId: string|void; [key: string]: any}};

  /**
  * Adds a step to be run during the [[Router]]'s navigation pipeline.
  *
  * @param name The name of the pipeline slot to insert the step into.
  * @param step The pipeline step.
  * @chainable
  */
  addPipelineStep(name: string, step: Function|PipelineStep): RouterConfiguration {
    if (step === null || step === undefined) {
      throw new Error('Pipeline step cannot be null or undefined.');
    }
    this.pipelineSteps.push({name, step});
    return this;
  }

  /**
  * Adds a step to be run during the [[Router]]'s authorize pipeline slot.
  *
  * @param step The pipeline step.
  * @chainable
  */
  addAuthorizeStep(step: Function|PipelineStep): RouterConfiguration {
    return this.addPipelineStep('authorize', step);
  }

  /**
  * Adds a step to be run during the [[Router]]'s preActivate pipeline slot.
  *
  * @param step The pipeline step.
  * @chainable
  */
  addPreActivateStep(step: Function|PipelineStep): RouterConfiguration {
    return this.addPipelineStep('preActivate', step);
  }

  /**
  * Adds a step to be run during the [[Router]]'s preRender pipeline slot.
  *
  * @param step The pipeline step.
  * @chainable
  */
  addPreRenderStep(step: Function|PipelineStep): RouterConfiguration {
    return this.addPipelineStep('preRender', step);
  }

  /**
  * Adds a step to be run during the [[Router]]'s postRender pipeline slot.
  *
  * @param step The pipeline step.
  * @chainable
  */
  addPostRenderStep(step: Function|PipelineStep): RouterConfiguration {
    return this.addPipelineStep('postRender', step);
  }

  /**
  * Configures a route that will be used if there is no previous location available on navigation cancellation.
  *
  * @param fragment The URL fragment to use as the navigation destination.
  * @chainable
  */
  fallbackRoute(fragment: string): RouterConfiguration {
    this._fallbackRoute = fragment;
    return this;
  }

  /**
  * Maps one or more routes to be registered with the router.
  *
  * @param route The [[RouteConfig]] to map, or an array of [[RouteConfig]] to map.
  * @chainable
  */
  map(route: RouteConfig|RouteConfig[]): RouterConfiguration {
    if (Array.isArray(route)) {
      route.forEach(this.map.bind(this));
      return this;
    }

    return this.mapRoute(route);
  }

  /**
   * Configures defaults to use for any view ports.
   *
   * @param viewPortConfig a view port configuration object to use as a
   *  default, of the form { viewPortName: { moduleId } }.
   * @chainable
   */
  useViewPortDefaults(viewPortConfig: {[name: string]: {moduleId: string; [key: string]: any}}): RouterConfiguration {
    this.viewPortDefaults = viewPortConfig;
    return this;
  }

  /**
  * Maps a single route to be registered with the router.
  *
  * @param route The [[RouteConfig]] to map.
  * @chainable
  */
  mapRoute(config: RouteConfig): RouterConfiguration {
    this.instructions.push(router => {
      let routeConfigs = _ensureArrayWithSingleRoutePerConfig(config);

      let navModel;
      for (let i = 0, ii = routeConfigs.length; i < ii; ++i) {
        let routeConfig = routeConfigs[i];
        routeConfig.settings = routeConfig.settings || {};
        if (!navModel) {
          navModel = router.createNavModel(routeConfig);
        }

        router.addRoute(routeConfig, navModel);
      }
    });

    return this;
  }

  /**
  * Registers an unknown route handler to be run when the URL fragment doesn't match any registered routes.
  *
  * @param config A string containing a moduleId to load, or a [[RouteConfig]], or a function that takes the
  *  [[NavigationInstruction]] and selects a moduleId to load.
  * @chainable
  */
  mapUnknownRoutes(config: string|RouteConfig|((instruction: NavigationInstruction) => string|RouteConfig|Promise<string|RouteConfig>)): RouterConfiguration {
    this.unknownRouteConfig = config;
    return this;
  }

  /**
  * Applies the current configuration to the specified [[Router]].
  *
  * @param router The [[Router]] to apply the configuration to.
  */
  exportToRouter(router: Router): void {
    let instructions = this.instructions;
    for (let i = 0, ii = instructions.length; i < ii; ++i) {
      instructions[i](router);
    }

    if (this.title) {
      router.title = this.title;
    }

    if (this.titleSeparator) {
      router.titleSeparator = this.titleSeparator;
    }

    if (this.unknownRouteConfig) {
      router.handleUnknownRoutes(this.unknownRouteConfig);
    }

    if (this._fallbackRoute) {
      router.fallbackRoute = this._fallbackRoute;
    }

    if (this.viewPortDefaults) {
      router.useViewPortDefaults(this.viewPortDefaults);
    }

    Object.assign(router.options, this.options);

    let pipelineSteps = this.pipelineSteps;
    if (pipelineSteps.length) {
      if (!router.isRoot) {
        throw new Error('Pipeline steps can only be added to the root router');
      }

      let pipelineProvider = router.pipelineProvider;
      for (let i = 0, ii = pipelineSteps.length; i < ii; ++i) {
        let {name, step} = pipelineSteps[i];
        pipelineProvider.addStep(name, step);
      }
    }
  }
}

/**
* The strategy to use when activating modules during navigation.
*/
export const activationStrategy: ActivationStrategy = {
  noChange: 'no-change',
  invokeLifecycle: 'invoke-lifecycle',
  replace: 'replace'
};

export class BuildNavigationPlanStep {
  run(navigationInstruction: NavigationInstruction, next: Function) {
    return _buildNavigationPlan(navigationInstruction)
      .then(plan => {
        if (plan instanceof Redirect) {
          return next.cancel(plan);
        }
        navigationInstruction.plan = plan;
        return next();
      }).catch(next.cancel);
  }
}

export function _buildNavigationPlan(instruction: NavigationInstruction, forceLifecycleMinimum): Promise<Object> {
  let config = instruction.config;

  if ('redirect' in config) {
    let router = instruction.router;
    return router._createNavigationInstruction(config.redirect)
      .then(newInstruction => {
        let params = {};
        for (let key in newInstruction.params) {
          // If the param on the redirect points to another param, e.g. { route: first/:this, redirect: second/:this }
          let val = newInstruction.params[key];
          if (typeof(val) === 'string' && val[0] === ':') {
            val = val.slice(1);
            // And if that param is found on the original instruction then use it
            if (val in instruction.params) {
              params[key] = instruction.params[val];
            }
          } else {
            params[key] = newInstruction.params[key];
          }
        }
        let redirectLocation = router.generate(newInstruction.config.name, params, instruction.options);

        if (instruction.queryString) {
          redirectLocation += '?' + instruction.queryString;
        }

        return Promise.resolve(new Redirect(redirectLocation));
      });
  }

  let prev = instruction.previousInstruction;
  let plan = {};
  let defaults = instruction.router.viewPortDefaults;

  if (prev) {
    let newParams = hasDifferentParameterValues(prev, instruction);
    let pending = [];

    for (let viewPortName in prev.viewPortInstructions) {
      let prevViewPortInstruction = prev.viewPortInstructions[viewPortName];
      let nextViewPortConfig = viewPortName in config.viewPorts ? config.viewPorts[viewPortName] : prevViewPortInstruction;
      if (nextViewPortConfig.moduleId === null && viewPortName in instruction.router.viewPortDefaults) {
        nextViewPortConfig = defaults[viewPortName];
      }

      let viewPortPlan = plan[viewPortName] = {
        name: viewPortName,
        config: nextViewPortConfig,
        prevComponent: prevViewPortInstruction.component,
        prevModuleId: prevViewPortInstruction.moduleId
      };

      if (prevViewPortInstruction.moduleId !== nextViewPortConfig.moduleId) {
        viewPortPlan.strategy = activationStrategy.replace;
      } else if ('determineActivationStrategy' in prevViewPortInstruction.component.viewModel) {
        viewPortPlan.strategy = prevViewPortInstruction.component.viewModel
          .determineActivationStrategy(...instruction.lifecycleArgs);
      } else if (config.activationStrategy) {
        viewPortPlan.strategy = config.activationStrategy;
      } else if (newParams || forceLifecycleMinimum) {
        viewPortPlan.strategy = activationStrategy.invokeLifecycle;
      } else {
        viewPortPlan.strategy = activationStrategy.noChange;
      }

      if (viewPortPlan.strategy !== activationStrategy.replace && prevViewPortInstruction.childRouter) {
        let path = instruction.getWildcardPath();
        let task = prevViewPortInstruction.childRouter
          ._createNavigationInstruction(path, instruction).then(childInstruction => { // eslint-disable-line no-loop-func
            viewPortPlan.childNavigationInstruction = childInstruction;

            return _buildNavigationPlan(
              childInstruction,
              viewPortPlan.strategy === activationStrategy.invokeLifecycle)
              .then(childPlan => {
                if (childPlan instanceof Redirect) {
                  return Promise.reject(childPlan);
                }
                childInstruction.plan = childPlan;
              });
          });

        pending.push(task);
      }
    }

    return Promise.all(pending).then(() => plan);
  }

  for (let viewPortName in config.viewPorts) {
    let viewPortConfig = config.viewPorts[viewPortName];
    if (viewPortConfig.moduleId === null && viewPortName in instruction.router.viewPortDefaults) {
      viewPortConfig = defaults[viewPortName];
    }
    plan[viewPortName] = {
      name: viewPortName,
      strategy: activationStrategy.replace,
      config: viewPortConfig
    };
  }

  return Promise.resolve(plan);
}

function hasDifferentParameterValues(prev: NavigationInstruction, next: NavigationInstruction): boolean {
  let prevParams = prev.params;
  let nextParams = next.params;
  let nextWildCardName = next.config.hasChildRouter ? next.getWildCardName() : null;

  for (let key in nextParams) {
    if (key === nextWildCardName) {
      continue;
    }

    if (prevParams[key] !== nextParams[key]) {
      return true;
    }
  }

  for (let key in prevParams) {
    if (key === nextWildCardName) {
      continue;
    }

    if (prevParams[key] !== nextParams[key]) {
      return true;
    }
  }

  if (!next.options.compareQueryParams) {
    return false;
  }

  let prevQueryParams = prev.queryParams;
  let nextQueryParams = next.queryParams;
  for (let key in nextQueryParams) {
    if (prevQueryParams[key] !== nextQueryParams[key]) {
      return true;
    }
  }

  for (let key in prevQueryParams) {
    if (prevQueryParams[key] !== nextQueryParams[key]) {
      return true;
    }
  }

  return false;
}

/**
* The primary class responsible for handling routing and navigation.
*
* @class Router
* @constructor
*/
export class Router {
  container: Container;
  history: History;
  viewPorts: Object;
  routes: RouteConfig[];

  /**
  * The [[Router]]'s current base URL, typically based on the [[Router.currentInstruction]].
  */
  baseUrl: string;

  /**
   * If defined, used in generation of document title for [[Router]]'s routes.
   */
  title: string | undefined;

  /**
   * The separator used in the document title between [[Router]]'s routes.
   */
  titleSeparator: string | undefined;

  /**
  * True if the [[Router]] has been configured.
  */
  isConfigured: boolean;

  /**
  * True if the [[Router]] is currently processing a navigation.
  */
  isNavigating: boolean;

  /**
  * True if the [[Router]] is navigating due to explicit call to navigate function(s).
  */
  isExplicitNavigation: boolean;

  /**
  * True if the [[Router]] is navigating due to explicit call to navigateBack function.
  */
  isExplicitNavigationBack: boolean;

  /**
  * True if the [[Router]] is navigating into the app for the first time in the browser session.
  */
  isNavigatingFirst: boolean;

  /**
  * True if the [[Router]] is navigating to a page instance not in the browser session history.
  */
  isNavigatingNew: boolean;

  /**
  * True if the [[Router]] is navigating forward in the browser session history.
  */
  isNavigatingForward: boolean;

  /**
  * True if the [[Router]] is navigating back in the browser session history.
  */
  isNavigatingBack: boolean;

  /**
  * True if the [[Router]] is navigating due to a browser refresh.
  */
  isNavigatingRefresh: boolean;

  /**
  * True if the previous instruction successfully completed the CanDeactivatePreviousStep in the current navigation.
  */
  couldDeactivate: boolean;

  /**
  * The currently active navigation tracker.
  */
  currentNavigationTracker: number;

  /**
  * The navigation models for routes that specified [[RouteConfig.nav]].
  */
  navigation: NavModel[];

  /**
  * The currently active navigation instruction.
  */
  currentInstruction: NavigationInstruction;

  /**
  * The parent router, or null if this instance is not a child router.
  */
  parent: Router = null;

  options: any = {};

  /**
  * The defaults used when a viewport lacks specified content
  */
  viewPortDefaults: any = {};

  /**
  * Extension point to transform the document title before it is built and displayed.
  * By default, child routers delegate to the parent router, and the app router
  * returns the title unchanged.
  */
  transformTitle: (title: string) => string = (title: string) => {
    if (this.parent) {
      return this.parent.transformTitle(title);
    }
    return title;
  };

  /**
  * @param container The [[Container]] to use when child routers.
  * @param history The [[History]] implementation to delegate navigation requests to.
  */
  constructor(container: Container, history: History) {
    this.container = container;
    this.history = history;
    this.reset();
  }

  /**
  * Fully resets the router's internal state. Primarily used internally by the framework when multiple calls to setRoot are made.
  * Use with caution (actually, avoid using this). Do not use this to simply change your navigation model.
  */
  reset() {
    this.viewPorts = {};
    this.routes = [];
    this.baseUrl = '';
    this.isConfigured = false;
    this.isNavigating = false;
    this.isExplicitNavigation = false;
    this.isExplicitNavigationBack = false;
    this.isNavigatingFirst = false;
    this.isNavigatingNew = false;
    this.isNavigatingRefresh = false;
    this.isNavigatingForward = false;
    this.isNavigatingBack = false;
    this.couldDeactivate = false;
    this.navigation = [];
    this.currentInstruction = null;
    this.viewPortDefaults = {};
    this._fallbackOrder = 100;
    this._recognizer = new RouteRecognizer();
    this._childRecognizer = new RouteRecognizer();
    this._configuredPromise = new Promise(resolve => {
      this._resolveConfiguredPromise = resolve;
    });
  }

  /**
  * Gets a value indicating whether or not this [[Router]] is the root in the router tree. I.e., it has no parent.
  */
  get isRoot(): boolean {
    return !this.parent;
  }

  /**
  * Registers a viewPort to be used as a rendering target for activated routes.
  *
  * @param viewPort The viewPort.
  * @param name The name of the viewPort. 'default' if unspecified.
  */
  registerViewPort(viewPort: any, name?: string): void {
    name = name || 'default';
    this.viewPorts[name] = viewPort;
  }

  /**
  * Returns a Promise that resolves when the router is configured.
  */
  ensureConfigured(): Promise<void> {
    return this._configuredPromise;
  }

  /**
  * Configures the router.
  *
  * @param callbackOrConfig The [[RouterConfiguration]] or a callback that takes a [[RouterConfiguration]].
  */
  configure(callbackOrConfig: RouterConfiguration|((config: RouterConfiguration) => RouterConfiguration)): Promise<void> {
    this.isConfigured = true;

    let result = callbackOrConfig;
    let config;
    if (typeof callbackOrConfig === 'function') {
      config = new RouterConfiguration();
      result = callbackOrConfig(config);
    }

    return Promise.resolve(result).then((c) => {
      if (c && c.exportToRouter) {
        config = c;
      }

      config.exportToRouter(this);
      this.isConfigured = true;
      this._resolveConfiguredPromise();
    });
  }

  /**
  * Navigates to a new location.
  *
  * @param fragment The URL fragment to use as the navigation destination.
  * @param options The navigation options.
  */
  navigate(fragment: string, options?: NavigationOptions): Promise<PipelineResult | boolean> {
    if (!this.isConfigured && this.parent) {
      return this.parent.navigate(fragment, options);
    }

    this.isExplicitNavigation = true;
    return this.history.navigate(_resolveUrl(fragment, this.baseUrl, this.history._hasPushState), options);
  }

  /**
  * Navigates to a new location corresponding to the route and params specified. Equivallent to [[Router.generate]] followed
  * by [[Router.navigate]].
  *
  * @param route The name of the route to use when generating the navigation location.
  * @param params The route parameters to be used when populating the route pattern.
  * @param options The navigation options.
  */
  navigateToRoute(route: string, params?: any, options?: NavigationOptions): Promise<PipelineResult | boolean> {
    let path = this.generate(route, params);
    return this.navigate(path, options);
  }

  /**
  * Navigates back to the most recent location in history.
  */
  navigateBack(): void {
    this.isExplicitNavigationBack = true;
    this.history.navigateBack();
  }

  /**
   * Creates a child router of the current router.
   *
   * @param container The [[Container]] to provide to the child router. Uses the current [[Router]]'s [[Container]] if unspecified.
   * @returns {Router} The new child Router.
   */
  createChild(container?: Container): Router {
    let childRouter = new Router(container || this.container.createChild(), this.history);
    childRouter.parent = this;
    return childRouter;
  }

  /**
  * Generates a URL fragment matching the specified route pattern.
  *
  * @param name The name of the route whose pattern should be used to generate the fragment.
  * @param params The route params to be used to populate the route pattern.
  * @param options If options.absolute = true, then absolute url will be generated; otherwise, it will be relative url.
  * @returns {string} A string containing the generated URL fragment.
  */
  generate(name: string, params?: any, options?: any = {}): string {
    let hasRoute = this._recognizer.hasRoute(name);
    if ((!this.isConfigured || !hasRoute) && this.parent) {
      return this.parent.generate(name, params, options);
    }

    if (!hasRoute) {
      throw new Error(`A route with name '${name}' could not be found. Check that \`name: '${name}'\` was specified in the route's config.`);
    }

    let path = this._recognizer.generate(name, params);
    let rootedPath = _createRootedPath(path, this.baseUrl, this.history._hasPushState, options.absolute);
    return options.absolute ? `${this.history.getAbsoluteRoot()}${rootedPath}` : rootedPath;
  }

  /**
  * Creates a [[NavModel]] for the specified route config.
  *
  * @param config The route config.
  */
  createNavModel(config: RouteConfig): NavModel {
    let navModel = new NavModel(this, 'href' in config ? config.href : config.route);
    navModel.title = config.title;
    navModel.order = config.nav;
    navModel.href = config.href;
    navModel.settings = config.settings;
    navModel.config = config;

    return navModel;
  }

  /**
  * Registers a new route with the router.
  *
  * @param config The [[RouteConfig]].
  * @param navModel The [[NavModel]] to use for the route. May be omitted for single-pattern routes.
  */
  addRoute(config: RouteConfig, navModel?: NavModel): void {
    if (Array.isArray(config.route)) {
      let routeConfigs = _ensureArrayWithSingleRoutePerConfig(config);
      routeConfigs.forEach(this.addRoute.bind(this));
      return;
    }

    validateRouteConfig(config, this.routes);

    if (!('viewPorts' in config) && !config.navigationStrategy) {
      config.viewPorts = {
        'default': {
          moduleId: config.moduleId,
          view: config.view
        }
      };
    }

    if (!navModel) {
      navModel = this.createNavModel(config);
    }

    this.routes.push(config);

    let path = config.route;
    if (path.charAt(0) === '/') {
      path = path.substr(1);
    }
    let caseSensitive = config.caseSensitive === true;
    let state = this._recognizer.add({path: path, handler: config, caseSensitive: caseSensitive});

    if (path) {
      let settings = config.settings;
      delete config.settings;
      let withChild = JSON.parse(JSON.stringify(config));
      config.settings = settings;
      withChild.route = `${path}/*childRoute`;
      withChild.hasChildRouter = true;
      this._childRecognizer.add({
        path: withChild.route,
        handler: withChild,
        caseSensitive: caseSensitive
      });

      withChild.navModel = navModel;
      withChild.settings = config.settings;
      withChild.navigationStrategy = config.navigationStrategy;
    }

    config.navModel = navModel;

    if ((navModel.order || navModel.order === 0) && this.navigation.indexOf(navModel) === -1) {
      if ((!navModel.href && navModel.href !== '') && (state.types.dynamics || state.types.stars)) {
        throw new Error('Invalid route config for "' + config.route + '" : dynamic routes must specify an "href:" to be included in the navigation model.');
      }

      if (typeof navModel.order !== 'number') {
        navModel.order = ++this._fallbackOrder;
      }

      this.navigation.push(navModel);
      this.navigation = this.navigation.sort((a, b) => a.order - b.order);
    }
  }

  /**
  * Gets a value indicating whether or not this [[Router]] or one of its ancestors has a route registered with the specified name.
  *
  * @param name The name of the route to check.
  */
  hasRoute(name: string): boolean {
    return !!(this._recognizer.hasRoute(name) || this.parent && this.parent.hasRoute(name));
  }

  /**
  * Gets a value indicating whether or not this [[Router]] has a route registered with the specified name.
  *
  * @param name The name of the route to check.
  */
  hasOwnRoute(name: string): boolean {
    return this._recognizer.hasRoute(name);
  }

  /**
  * Register a handler to use when the incoming URL fragment doesn't match any registered routes.
  *
  * @param config The moduleId, or a function that selects the moduleId, or a [[RouteConfig]].
  */
  handleUnknownRoutes(config?: string|Function|RouteConfig): void {
    if (!config) {
      throw new Error('Invalid unknown route handler');
    }

    this.catchAllHandler = instruction => {
      return this._createRouteConfig(config, instruction)
        .then(c => {
          instruction.config = c;
          return instruction;
        });
    };
  }

  /**
  * Updates the document title using the current navigation instruction.
  */
  updateTitle(): void {
    if (this.parent) {
      return this.parent.updateTitle();
    }

    if (this.currentInstruction) {
      this.currentInstruction._updateTitle();
    }
    return undefined;
  }

  /**
  * Updates the navigation routes with hrefs relative to the current location.
  * Note: This method will likely move to a plugin in a future release.
  */
  refreshNavigation(): void {
    let nav = this.navigation;

    for (let i = 0, length = nav.length; i < length; i++) {
      let current = nav[i];
      if (!current.config.href) {
        current.href = _createRootedPath(current.relativeHref, this.baseUrl, this.history._hasPushState);
      } else {
        current.href = _normalizeAbsolutePath(current.config.href, this.history._hasPushState);
      }
    }
  }

  /**
   * Sets the default configuration for the view ports. This specifies how to
   *  populate a view port for which no module is specified. The default is
   *  an empty view/view-model pair.
   */
  useViewPortDefaults(viewPortDefaults: any) {
    for (let viewPortName in viewPortDefaults) {
      let viewPortConfig = viewPortDefaults[viewPortName];
      this.viewPortDefaults[viewPortName] = {
        moduleId: viewPortConfig.moduleId
      };
    }
  }

  _refreshBaseUrl(): void {
    if (this.parent) {
      this.baseUrl = generateBaseUrl(this.parent, this.parent.currentInstruction);
    }
  }

  _createNavigationInstruction(url: string = '', parentInstruction: NavigationInstruction = null): Promise<NavigationInstruction> {
    let fragment = url;
    let queryString = '';

    let queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      fragment = url.substr(0, queryIndex);
      queryString = url.substr(queryIndex + 1);
    }

    let results = this._recognizer.recognize(url);
    if (!results || !results.length) {
      results = this._childRecognizer.recognize(url);
    }

    let instructionInit = {
      fragment,
      queryString,
      config: null,
      parentInstruction,
      previousInstruction: this.currentInstruction,
      router: this,
      options: {
        compareQueryParams: this.options.compareQueryParams
      }
    };

    let result;

    if (results && results.length) {
      let first = results[0];
      let instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
        params: first.params,
        queryParams: first.queryParams || results.queryParams,
        config: first.config || first.handler
      }));

      if (typeof first.handler === 'function') {
        result = evaluateNavigationStrategy(instruction, first.handler, first);
      } else if (first.handler && typeof first.handler.navigationStrategy === 'function') {
        result = evaluateNavigationStrategy(instruction, first.handler.navigationStrategy, first.handler);
      } else {
        result = Promise.resolve(instruction);
      }
    } else if (this.catchAllHandler) {
      let instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
        params: { path: fragment },
        queryParams: results ? results.queryParams : {},
        config: null // config will be created by the catchAllHandler
      }));

      result = evaluateNavigationStrategy(instruction, this.catchAllHandler);
    } else if (this.parent) {
      let router = this._parentCatchAllHandler(this.parent);

      if (router) {
        let newParentInstruction = this._findParentInstructionFromRouter(router, parentInstruction);

        let instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
          params: { path: fragment },
          queryParams: results ? results.queryParams : {},
          router: router,
          parentInstruction: newParentInstruction,
          parentCatchHandler: true,
          config: null // config will be created by the chained parent catchAllHandler
        }));

        result = evaluateNavigationStrategy(instruction, router.catchAllHandler);
      }
    }

    if (result && parentInstruction) {
      this.baseUrl = generateBaseUrl(this.parent, parentInstruction);
    }

    return result || Promise.reject(new Error(`Route not found: ${url}`));
  }

  _findParentInstructionFromRouter(router: Router, instruction: NavigationInstruction): NavigationInstruction {
    if (instruction.router === router) {
      instruction.fragment = router.baseUrl; //need to change the fragment in case of a redirect instead of moduleId
      return instruction;
    } else if (instruction.parentInstruction) {
      return this._findParentInstructionFromRouter(router, instruction.parentInstruction);
    }
    return undefined;
  }

  _parentCatchAllHandler(router): Function|Boolean {
    if (router.catchAllHandler) {
      return router;
    } else if (router.parent) {
      return this._parentCatchAllHandler(router.parent);
    }
    return false;
  }

  _createRouteConfig(config, instruction) {
    return Promise.resolve(config)
      .then(c => {
        if (typeof c === 'string') {
          return { moduleId: c };
        } else if (typeof c === 'function') {
          return c(instruction);
        }

        return c;
      })
      .then(c => typeof c === 'string' ? { moduleId: c } : c)
      .then(c => {
        c.route = instruction.params.path;
        validateRouteConfig(c, this.routes);

        if (!c.navModel) {
          c.navModel = this.createNavModel(c);
        }

        return c;
      });
  }
}

function generateBaseUrl(router: Router, instruction: NavigationInstruction) {
  return `${router.baseUrl || ''}${instruction.getBaseUrl() || ''}`;
}

function validateRouteConfig(config: RouteConfig, routes: Array<Object>): void {
  if (typeof config !== 'object') {
    throw new Error('Invalid Route Config');
  }

  if (typeof config.route !== 'string') {
    let name = config.name || '(no name)';
    throw new Error('Invalid Route Config for "' + name + '": You must specify a "route:" pattern.');
  }

  if (!('redirect' in config || config.moduleId || config.navigationStrategy || config.viewPorts)) {
    throw new Error('Invalid Route Config for "' + config.route + '": You must specify a "moduleId:", "redirect:", "navigationStrategy:", or "viewPorts:".');
  }
}

function evaluateNavigationStrategy(instruction: NavigationInstruction, evaluator: Function, context: any): Promise<NavigationInstruction> {
  return Promise.resolve(evaluator.call(context, instruction)).then(() => {
    if (!('viewPorts' in instruction.config)) {
      instruction.config.viewPorts = {
        'default': {
          moduleId: instruction.config.moduleId
        }
      };
    }

    return instruction;
  });
}

export class CanDeactivatePreviousStep {
  run(navigationInstruction: NavigationInstruction, next: Function) {
    return processDeactivatable(navigationInstruction, 'canDeactivate', next);
  }
}

export class CanActivateNextStep {
  run(navigationInstruction: NavigationInstruction, next: Function) {
    return processActivatable(navigationInstruction, 'canActivate', next);
  }
}

export class DeactivatePreviousStep {
  run(navigationInstruction: NavigationInstruction, next: Function) {
    return processDeactivatable(navigationInstruction, 'deactivate', next, true);
  }
}

export class ActivateNextStep {
  run(navigationInstruction: NavigationInstruction, next: Function) {
    return processActivatable(navigationInstruction, 'activate', next, true);
  }
}

function processDeactivatable(navigationInstruction: NavigationInstruction, callbackName: string, next: Function, ignoreResult: boolean) {
  const plan = navigationInstruction.plan;
  let infos = findDeactivatable(plan, callbackName);
  let i = infos.length; //query from inside out

  function inspect(val) {
    if (ignoreResult || shouldContinue(val)) {
      return iterate();
    }

    return next.cancel(val);
  }

  function iterate() {
    if (i--) {
      try {
        let viewModel = infos[i];
        let result = viewModel[callbackName](navigationInstruction);
        return processPotential(result, inspect, next.cancel);
      } catch (error) {
        return next.cancel(error);
      }
    }

    navigationInstruction.router.couldDeactivate = true;

    return next();
  }

  return iterate();
}

function findDeactivatable(plan, callbackName, list: Array<Object> = []): Array<Object> {
  for (let viewPortName in plan) {
    let viewPortPlan = plan[viewPortName];
    let prevComponent = viewPortPlan.prevComponent;

    if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle ||
        viewPortPlan.strategy === activationStrategy.replace) &&
        prevComponent) {
      let viewModel = prevComponent.viewModel;

      if (callbackName in viewModel) {
        list.push(viewModel);
      }
    }

    if (viewPortPlan.strategy === activationStrategy.replace && prevComponent) {
      addPreviousDeactivatable(prevComponent, callbackName, list);
    } else if (viewPortPlan.childNavigationInstruction) {
      findDeactivatable(viewPortPlan.childNavigationInstruction.plan, callbackName, list);
    }
  }

  return list;
}

function addPreviousDeactivatable(component, callbackName, list): void {
  let childRouter = component.childRouter;

  if (childRouter && childRouter.currentInstruction) {
    let viewPortInstructions = childRouter.currentInstruction.viewPortInstructions;

    for (let viewPortName in viewPortInstructions) {
      let viewPortInstruction = viewPortInstructions[viewPortName];
      let prevComponent = viewPortInstruction.component;
      let prevViewModel = prevComponent.viewModel;

      if (callbackName in prevViewModel) {
        list.push(prevViewModel);
      }

      addPreviousDeactivatable(prevComponent, callbackName, list);
    }
  }
}

function processActivatable(navigationInstruction: NavigationInstruction, callbackName: any, next: Function, ignoreResult: boolean) {
  let infos = findActivatable(navigationInstruction, callbackName);
  let length = infos.length;
  let i = -1; //query from top down

  function inspect(val, router) {
    if (ignoreResult || shouldContinue(val, router)) {
      return iterate();
    }

    return next.cancel(val);
  }

  function iterate() {
    i++;

    if (i < length) {
      try {
        let current = infos[i];
        let result = current.viewModel[callbackName](...current.lifecycleArgs);
        return processPotential(result, val => inspect(val, current.router), next.cancel);
      } catch (error) {
        return next.cancel(error);
      }
    }

    return next();
  }

  return iterate();
}

function findActivatable(navigationInstruction: NavigationInstruction, callbackName: string, list: Array<Object> = [], router: Router): Array<Object> {
  let plan = navigationInstruction.plan;

  Object.keys(plan).filter((viewPortName) => {
    let viewPortPlan = plan[viewPortName];
    let viewPortInstruction = navigationInstruction.viewPortInstructions[viewPortName];
    let viewModel = viewPortInstruction.component.viewModel;

    if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle || viewPortPlan.strategy === activationStrategy.replace) && callbackName in viewModel) {
      list.push({
        viewModel,
        lifecycleArgs: viewPortInstruction.lifecycleArgs,
        router
      });
    }

    if (viewPortPlan.childNavigationInstruction) {
      findActivatable(
        viewPortPlan.childNavigationInstruction,
        callbackName,
        list,
        viewPortInstruction.component.childRouter || router
      );
    }
  });

  return list;
}

function shouldContinue(output, router: Router) {
  if (output instanceof Error) {
    return false;
  }

  if (isNavigationCommand(output)) {
    if (typeof output.setRouter === 'function') {
      output.setRouter(router);
    }

    return !!output.shouldContinueProcessing;
  }

  if (output === undefined) {
    return true;
  }

  return output;
}

/**
 * A basic interface for an Observable type
 */
interface IObservable {
  subscribe(): ISubscription;
}

/**
 * A basic interface for a Subscription to an Observable
 */
interface ISubscription {
  unsubscribe(): void;
}

type SafeSubscriptionFunc = (sub: SafeSubscription) => ISubscription;

/**
 * wraps a subscription, allowing unsubscribe calls even if
 * the first value comes synchronously
 */
class SafeSubscription {
  constructor(subscriptionFunc: SafeSubscriptionFunc) {
    this._subscribed = true;
    this._subscription = subscriptionFunc(this);

    if (!this._subscribed) this.unsubscribe();
  }

  get subscribed(): boolean {
    return this._subscribed;
  }

  unsubscribe(): void {
    if (this._subscribed && this._subscription) this._subscription.unsubscribe();

    this._subscribed = false;
  }
}

function processPotential(obj, resolve, reject) {
  if (obj && typeof obj.then === 'function') {
    return Promise.resolve(obj).then(resolve).catch(reject);
  }

  if (obj && typeof obj.subscribe === 'function') {
    let obs: IObservable = obj;
    return new SafeSubscription(sub => obs.subscribe({
      next() {
        if (sub.subscribed) {
          sub.unsubscribe();
          resolve(obj);
        }
      },
      error(error) {
        if (sub.subscribed) {
          sub.unsubscribe();
          reject(error);
        }
      },
      complete() {
        if (sub.subscribed) {
          sub.unsubscribe();
          resolve(obj);
        }
      }
    }));
  }

  try {
    return resolve(obj);
  } catch (error) {
    return reject(error);
  }
}

export class RouteLoader {
  loadRoute(router: any, config: any, navigationInstruction: any) {
    throw Error('Route loaders must implement "loadRoute(router, config, navigationInstruction)".');
  }
}

export class LoadRouteStep {
  static inject() { return [RouteLoader]; }

  constructor(routeLoader: RouteLoader) {
    this.routeLoader = routeLoader;
  }

  run(navigationInstruction: NavigationInstruction, next: Function) {
    return loadNewRoute(this.routeLoader, navigationInstruction)
      .then(next)
      .catch(next.cancel);
  }
}

function loadNewRoute(routeLoader: RouteLoader, navigationInstruction: NavigationInstruction) {
  let toLoad = determineWhatToLoad(navigationInstruction);
  let loadPromises = toLoad.map((current) => loadRoute(
    routeLoader,
    current.navigationInstruction,
    current.viewPortPlan
    )
  );

  return Promise.all(loadPromises);
}

function determineWhatToLoad(navigationInstruction: NavigationInstruction, toLoad: Array<Object> = []) {
  let plan = navigationInstruction.plan;

  for (let viewPortName in plan) {
    let viewPortPlan = plan[viewPortName];

    if (viewPortPlan.strategy === activationStrategy.replace) {
      toLoad.push({ viewPortPlan, navigationInstruction });

      if (viewPortPlan.childNavigationInstruction) {
        determineWhatToLoad(viewPortPlan.childNavigationInstruction, toLoad);
      }
    } else {
      let viewPortInstruction = navigationInstruction.addViewPortInstruction(
        viewPortName,
        viewPortPlan.strategy,
        viewPortPlan.prevModuleId,
        viewPortPlan.prevComponent);

      if (viewPortPlan.childNavigationInstruction) {
        viewPortInstruction.childNavigationInstruction = viewPortPlan.childNavigationInstruction;
        determineWhatToLoad(viewPortPlan.childNavigationInstruction, toLoad);
      }
    }
  }

  return toLoad;
}

function loadRoute(routeLoader: RouteLoader, navigationInstruction: NavigationInstruction, viewPortPlan: any) {
  let moduleId = viewPortPlan.config ? viewPortPlan.config.moduleId : null;

  return loadComponent(routeLoader, navigationInstruction, viewPortPlan.config).then((component) => {
    let viewPortInstruction = navigationInstruction.addViewPortInstruction(
      viewPortPlan.name,
      viewPortPlan.strategy,
      moduleId,
      component);

    let childRouter = component.childRouter;
    if (childRouter) {
      let path = navigationInstruction.getWildcardPath();

      return childRouter._createNavigationInstruction(path, navigationInstruction)
        .then((childInstruction) => {
          viewPortPlan.childNavigationInstruction = childInstruction;

          return _buildNavigationPlan(childInstruction)
            .then((childPlan) => {
              if (childPlan instanceof Redirect) {
                return Promise.reject(childPlan);
              }
              childInstruction.plan = childPlan;
              viewPortInstruction.childNavigationInstruction = childInstruction;

              return loadNewRoute(routeLoader, childInstruction);
            });
        });
    }

    return undefined;
  });
}

function loadComponent(routeLoader: RouteLoader, navigationInstruction: NavigationInstruction, config: any) {
  let router = navigationInstruction.router;
  let lifecycleArgs = navigationInstruction.lifecycleArgs;

  return routeLoader.loadRoute(router, config, navigationInstruction).then((component) => {
    let {viewModel, childContainer} = component;
    component.router = router;
    component.config = config;

    if ('configureRouter' in viewModel) {
      let childRouter = childContainer.getChildRouter();
      component.childRouter = childRouter;

      return childRouter.configure(c => viewModel.configureRouter(c, childRouter, ...lifecycleArgs))
        .then(() => component);
    }

    return component;
  });
}

class PipelineSlot {
  steps = [];

  constructor(container, name, alias) {
    this.container = container;
    this.slotName = name;
    this.slotAlias = alias;
  }

  getSteps() {
    return this.steps.map(x => this.container.get(x));
  }
}

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
  createPipeline(useCanDeactivateStep: boolean = true): Pipeline {
    let pipeline = new Pipeline();
    this.steps.forEach(step => {
      if (useCanDeactivateStep || step !== CanDeactivatePreviousStep) {
        pipeline.addStep(this.container.get(step));
      }
    });
    return pipeline;
  }

  _findStep(name: string) {
    return this.steps.find(x => x.slotName === name || x.slotAlias === name);
  }

  /**
  * Adds a step into the pipeline at a known slot location.
  */
  addStep(name: string, step: PipelineStep): void {
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
  removeStep(name: string, step: PipelineStep) {
    let slot = this._findStep(name);
    if (slot) {
      slot.steps.splice(slot.steps.indexOf(step), 1);
    }
  }

  /**
   * Clears all steps from a slot in the pipeline
   */
  _clearSteps(name: string = '') {
    let slot = this._findStep(name);
    if (slot) {
      slot.steps = [];
    }
  }

  /**
   * Resets all pipeline slots
   */
  reset() {
    this._clearSteps('authorize');
    this._clearSteps('preActivate');
    this._clearSteps('preRender');
    this._clearSteps('postRender');
  }

  _createPipelineSlot(name, alias) {
    return new PipelineSlot(this.container, name, alias);
  }
}

const logger = LogManager.getLogger('app-router');

/**
* The main application router.
*/
export class AppRouter extends Router {
  static inject() { return [Container, History, PipelineProvider, EventAggregator]; }

  constructor(container: Container, history: History, pipelineProvider: PipelineProvider, events: EventAggregator) {
    super(container, history); //Note the super will call reset internally.
    this.pipelineProvider = pipelineProvider;
    this.events = events;
  }

  /**
  * Fully resets the router's internal state. Primarily used internally by the framework when multiple calls to setRoot are made.
  * Use with caution (actually, avoid using this). Do not use this to simply change your navigation model.
  */
  reset() {
    super.reset();
    this.maxInstructionCount = 10;
    if (!this._queue) {
      this._queue = [];
    } else {
      this._queue.length = 0;
    }
  }

  /**
  * Loads the specified URL.
  *
  * @param url The URL fragment to load.
  */
  loadUrl(url): Promise<NavigationInstruction> {
    return this._createNavigationInstruction(url)
      .then(instruction => this._queueInstruction(instruction))
      .catch(error => {
        logger.error(error);
        restorePreviousLocation(this);
      });
  }

  /**
  * Registers a viewPort to be used as a rendering target for activated routes.
  *
  * @param viewPort The viewPort.
  * @param name The name of the viewPort. 'default' if unspecified.
  */
  registerViewPort(viewPort: any, name: string): Promise<any> {
    super.registerViewPort(viewPort, name);

    if (!this.isActive) {
      let viewModel = this._findViewModel(viewPort);
      if ('configureRouter' in viewModel) {
        if (!this.isConfigured) {
          let resolveConfiguredPromise = this._resolveConfiguredPromise;
          this._resolveConfiguredPromise = () => {};
          return this.configure(config => viewModel.configureRouter(config, this))
            .then(() => {
              this.activate();
              resolveConfiguredPromise();
            });
        }
      } else {
        this.activate();
      }
    } else {
      this._dequeueInstruction();
    }

    return Promise.resolve();
  }

  /**
  * Activates the router. This instructs the router to begin listening for history changes and processing instructions.
  *
  * @params options The set of options to activate the router with.
  */
  activate(options: Object): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
    this.history.activate(this.options);
    this._dequeueInstruction();
  }

  /**
  * Deactivates the router.
  */
  deactivate(): void {
    this.isActive = false;
    this.history.deactivate();
  }

  _queueInstruction(instruction: NavigationInstruction): Promise<any> {
    return new Promise((resolve) => {
      instruction.resolve = resolve;
      this._queue.unshift(instruction);
      this._dequeueInstruction();
    });
  }

  _dequeueInstruction(instructionCount: number = 0): Promise<any> {
    return Promise.resolve().then(() => {
      if (this.isNavigating && !instructionCount) {
        return undefined;
      }

      let instruction = this._queue.shift();
      this._queue.length = 0;

      if (!instruction) {
        return undefined;
      }

      this.isNavigating = true;

      let navtracker: number = this.history.getState('NavigationTracker');
      if (!navtracker && !this.currentNavigationTracker) {
        this.isNavigatingFirst = true;
        this.isNavigatingNew = true;
      } else if (!navtracker) {
        this.isNavigatingNew = true;
      } else if (!this.currentNavigationTracker) {
        this.isNavigatingRefresh = true;
      } else if (this.currentNavigationTracker < navtracker) {
        this.isNavigatingForward = true;
      } else if (this.currentNavigationTracker > navtracker) {
        this.isNavigatingBack = true;
      } if (!navtracker) {
        navtracker = Date.now();
        this.history.setState('NavigationTracker', navtracker);
      }
      this.currentNavigationTracker = navtracker;

      instruction.previousInstruction = this.currentInstruction;

      if (!instructionCount) {
        this.events.publish('router:navigation:processing', { instruction });
      } else if (instructionCount === this.maxInstructionCount - 1) {
        logger.error(`${instructionCount + 1} navigation instructions have been attempted without success. Restoring last known good location.`);
        restorePreviousLocation(this);
        return this._dequeueInstruction(instructionCount + 1);
      } else if (instructionCount > this.maxInstructionCount) {
        throw new Error('Maximum navigation attempts exceeded. Giving up.');
      }

      let pipeline = this.pipelineProvider.createPipeline(!this.couldDeactivate);

      return pipeline
        .run(instruction)
        .then(result => processResult(instruction, result, instructionCount, this))
        .catch(error => {
          return { output: error instanceof Error ? error : new Error(error) };
        })
        .then(result => resolveInstruction(instruction, result, !!instructionCount, this));
    });
  }

  _findViewModel(viewPort: Object): Object {
    if (this.container.viewModel) {
      return this.container.viewModel;
    }

    if (viewPort.container) {
      let container = viewPort.container;

      while (container) {
        if (container.viewModel) {
          this.container.viewModel = container.viewModel;
          return container.viewModel;
        }

        container = container.parent;
      }
    }

    return undefined;
  }
}

function processResult(instruction, result, instructionCount, router) {
  if (!(result && 'completed' in result && 'output' in result)) {
    result = result || {};
    result.output = new Error(`Expected router pipeline to return a navigation result, but got [${JSON.stringify(result)}] instead.`);
  }

  let finalResult = null;
  let navigationCommandResult = null;
  if (isNavigationCommand(result.output)) {
    navigationCommandResult = result.output.navigate(router);
  } else {
    finalResult = result;

    if (!result.completed) {
      if (result.output instanceof Error) {
        logger.error(result.output);
      }

      restorePreviousLocation(router);
    }
  }

  return Promise.resolve(navigationCommandResult)
    .then(_ => router._dequeueInstruction(instructionCount + 1))
    .then(innerResult => finalResult || innerResult || result);
}

function resolveInstruction(instruction, result, isInnerInstruction, router) {
  instruction.resolve(result);

  let eventArgs = { instruction, result };
  if (!isInnerInstruction) {
    router.isNavigating = false;
    router.isExplicitNavigation = false;
    router.isExplicitNavigationBack = false;
    router.isNavigatingFirst = false;
    router.isNavigatingNew = false;
    router.isNavigatingRefresh = false;
    router.isNavigatingForward = false;
    router.isNavigatingBack = false;
    router.couldDeactivate = false;

    let eventName;

    if (result.output instanceof Error) {
      eventName = 'error';
    } else if (!result.completed) {
      eventName = 'canceled';
    } else {
      let queryString = instruction.queryString ? ('?' + instruction.queryString) : '';
      router.history.previousLocation = instruction.fragment + queryString;
      eventName = 'success';
    }

    router.events.publish(`router:navigation:${eventName}`, eventArgs);
    router.events.publish('router:navigation:complete', eventArgs);
  } else {
    router.events.publish('router:navigation:child:complete', eventArgs);
  }

  return result;
}

function restorePreviousLocation(router) {
  let previousLocation = router.history.previousLocation;
  if (previousLocation) {
    router.navigate(router.history.previousLocation, { trigger: false, replace: true });
  } else if (router.fallbackRoute) {
    router.navigate(router.fallbackRoute, { trigger: true, replace: true });
  } else {
    logger.error('Router navigation failed, and no previous location or fallbackRoute could be restored.');
  }
}
