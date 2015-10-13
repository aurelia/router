import 'core-js';
import * as LogManager from 'aurelia-logging';
import {Container} from 'aurelia-dependency-injection';
import {DOM} from 'aurelia-pal';
import {RouteRecognizer} from 'aurelia-route-recognizer';
import {History} from 'aurelia-history';
import {EventAggregator} from 'aurelia-event-aggregator';

export class RouteFilterContainer {
  static inject() { return [Container]; }

  constructor(container: Container) {
    this.container = container;
    this.filters = { };
    this.filterCache = { };
  }

  addStep(name: string, step: any, index: number = -1): void {
    let filter = this.filters[name];
    if (!filter) {
      filter = this.filters[name] = [];
    }

    if (index === -1) {
      index = filter.length;
    }

    filter.splice(index, 0, step);
    this.filterCache = {};
  }

  getFilterSteps(name: string) {
    if (this.filterCache[name]) {
      return this.filterCache[name];
    }

    let steps = [];
    let filter = this.filters[name];
    if (!filter) {
      return steps;
    }

    for (let i = 0, l = filter.length; i < l; i++) {
      if (typeof filter[i] === 'string') {
        steps.push(...this.getFilterSteps(filter[i]));
      } else {
        steps.push(this.container.get(filter[i]));
      }
    }

    this.filterCache[name] = steps;
    return steps;
  }
}

export function createRouteFilterStep(name: string): Function {
  function create(routeFilterContainer) {
    return new RouteFilterStep(name, routeFilterContainer);
  }

  create.inject = function() {
    return [RouteFilterContainer];
  };

  return create;
}

class RouteFilterStep {
  isMultiStep: boolean = true;

  constructor(name: string, routeFilterContainer: RouteFilterContainer) {
    this.name = name;
    this.routeFilterContainer = routeFilterContainer;
  }

  getSteps() {
    return this.routeFilterContainer.getFilterSteps(this.name);
  }
}

function createResult(ctx, next) {
  return {
    status: next.status,
    context: ctx,
    output: next.output,
    completed: next.status === pipelineStatus.completed
  };
}

export const pipelineStatus = {
  completed: 'completed',
  canceled: 'canceled',
  rejected: 'rejected',
  running: 'running'
};

interface PipelineStep {
  run(context: Object, next: Function): void;
}

export class Pipeline {
  steps: Array<Function|PipelineStep> = [];

  withStep(step) {
    let run;

    if (typeof step === 'function') {
      run = step;
    } else if (step.isMultiStep) {
      let steps = step.getSteps();
      for (let i = 0, l = steps.length; i < l; i++) {
        this.withStep(steps[i]);
      }

      return this;
    } else {
      run = step.run.bind(step);
    }

    this.steps.push(run);

    return this;
  }

  run(ctx) {
    let index = -1;
    let steps = this.steps;

    function next() {
      index++;

      if (index < steps.length) {
        let currentStep = steps[index];

        try {
          return currentStep(ctx, next);
        } catch (e) {
          return next.reject(e);
        }
      } else {
        return next.complete();
      }
    }

    next.complete = (output) => {
      next.status = pipelineStatus.completed;
      next.output = output;
      return Promise.resolve(createResult(ctx, next));
    };

    next.cancel = (reason) => {
      next.status = pipelineStatus.canceled;
      next.output = reason;
      return Promise.resolve(createResult(ctx, next));
    };

    next.reject = (error) => {
      next.status = pipelineStatus.rejected;
      next.output = error;
      return Promise.resolve(createResult(ctx, next));
    };

    next.status = pipelineStatus.running;

    return next();
  }
}

export class NavigationInstruction {
  fragment: string;
  queryString: string;
  params: any;
  queryParams: any;
  config: any;
  parentInstruction: NavigationInstruction;

  constructor(fragment: string, queryString?: string, params?: any, queryParams?: any, config?: any, parentInstruction?: NavigationInstruction) {
    this.fragment = fragment;
    this.queryString = queryString;
    this.params = params || {};
    this.queryParams = queryParams;
    this.config = config;
    this.viewPortInstructions = {};
    this.parentInstruction = parentInstruction;

    let ancestorParams = [];
    let current = this;
    do {
      let currentParams = Object.assign({}, current.params);
      if (current.config.hasChildRouter) {
        // remove the param for the injected child route segment
        delete currentParams[current.getWildCardName()];
      }

      ancestorParams.unshift(currentParams);
      current = current.parentInstruction;
    } while (current);

    let allParams = Object.assign({}, queryParams, ...ancestorParams);
    this.lifecycleArgs = [allParams, config, this];
  }

  addViewPortInstruction(viewPortName, strategy, moduleId, component): any {
    let viewportInstruction = this.viewPortInstructions[viewPortName] = {
      name: viewPortName,
      strategy: strategy,
      moduleId: moduleId,
      component: component,
      childRouter: component.childRouter,
      lifecycleArgs: this.lifecycleArgs.slice()
    };

    return viewportInstruction;
  }

  getWildCardName(): string {
    let wildcardIndex = this.config.route.lastIndexOf('*');
    return this.config.route.substr(wildcardIndex + 1);
  }

  getWildcardPath(): string {
    let wildcardName = this.getWildCardName();
    let path = this.params[wildcardName] || '';

    if (this.queryString) {
      path += '?' + this.queryString;
    }

    return path;
  }

  getBaseUrl(): string {
    if (!this.params) {
      return this.fragment;
    }

    let wildcardName = this.getWildCardName();
    let path = this.params[wildcardName] || '';

    if (!path) {
      return this.fragment;
    }

    return this.fragment.substr(0, this.fragment.lastIndexOf(path));
  }
}

/**
* Class for storing and interacting with a route's navigation settings.
*
* @class NavModel
* @constructor
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
  config: Object = null;

  constructor(router, relativeHref) {
    this.router = router;
    this.relativeHref = relativeHref;
  }

  /**
  * Sets the route's title and updates document.title.
  *  If the a navigation is in progress, the change will be applied
  *  to document.title when the navigation completes.
  *
  * @method setTitle
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
  //navigationStrategy?: (instruction:NavigationInstruction) => Promise<void>|void;

  /**
  * The view ports to target when activating this route. If unspecified, the target moduleId is loaded
  * into the default viewPort (the viewPort with name 'default'). The viewPorts object should have keys
  * whose property names correspond to names used by <router-view> elements. The values should be objects
  * specifying the moduleId to load into that viewPort.
  */
  viewPorts?: Object;

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
  * The document title to set when this route is active.
  */
  title?: string;

  /**
  * Arbitrary data to attach to the route. This can be used to attached custom data needed by components
  * like pipeline steps and activated modules.
  */
  settings?: any;

  [x: string]: any;
}

export function processPotential(obj, resolve, reject) {
  if (obj && typeof obj.then === 'function') {
    let dfd = obj.then(resolve);

    if (typeof dfd.catch === 'function') {
      return dfd.catch(reject);
    } else if (typeof dfd.fail === 'function') {
      return dfd.fail(reject);
    }

    return dfd;
  }

  try {
    return resolve(obj);
  } catch (error) {
    return reject(error);
  }
}

export function normalizeAbsolutePath(path, hasPushState) {
  if (!hasPushState && path[0] !== '#') {
    path = '#' + path;
  }

  return path;
}

export function createRootedPath(fragment, baseUrl, hasPushState) {
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

  return normalizeAbsolutePath(path + fragment, hasPushState);
}

export function resolveUrl(fragment, baseUrl, hasPushState) {
  if (isRootedPath.test(fragment)) {
    return normalizeAbsolutePath(fragment, hasPushState);
  }

  return createRootedPath(fragment, baseUrl, hasPushState);
}

const isRootedPath = /^#?\//;
const isAbsoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;

/**
 * Determines if the provided object is a navigation command.
 * A navigation command is anything with a navigate method.
 * @param {object} obj The item to check.
 * @return {boolean}
 */
export function isNavigationCommand(obj): boolean {
  return obj && typeof obj.navigate === 'function';
}

/**
* Used during the activation lifecycle to cause a redirect.
*
* @class Redirect
* @constructor
* @param {String} url The url to redirect to.
*/
export class Redirect {
  constructor(url: string, options: Object = {}) {
    this.url = url;
    this.options = Object.assign({ trigger: true, replace: true }, options);
    this.shouldContinueProcessing = false;
  }

  /**
  * Called by the activation system to set the child router.
  *
  * @method setRouter
  * @param {Router} router
  */
  setRouter(router: Router): void {
    this.router = router;
  }

  /**
  * Called by the navigation pipeline to navigate.
  *
  * @method navigate
  * @param {Router} appRouter - a router which should redirect
  */
  navigate(appRouter: Router): void {
    let navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
    navigatingRouter.navigate(this.url, this.options);
  }
}

/**
 * Class used to configure a [[Router]] instance.
 *
 * @constructor
 */
export class RouterConfiguration {
  instructions = [];
  options = {};
  pipelineSteps: Array<Object> = [];
  title: string;
  unknownRouteConfig: any;

  /**
  * Adds a step to be run during the [[Router]]'s navigation pipeline.
  *
  * @param name The name of the pipeline slot to insert the step into.
  * @param step The pipeline step.
  * @chainable
  */
  addPipelineStep(name: string, step: Object|Function): RouterConfiguration {
    this.pipelineSteps.push({name, step});
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
  * Maps a single route to be registered with the router.
  *
  * @param route The [[RouteConfig]] to map.
  * @chainable
  */
  mapRoute(config: RouteConfig): RouterConfiguration {
    this.instructions.push(router => {
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
  mapUnknownRoutes(config: string|RouteConfig|(instruction: NavigationInstruction) => void|Promise<void>) : RouterConfiguration {
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

    if (this.unknownRouteConfig) {
      router.handleUnknownRoutes(this.unknownRouteConfig);
    }

    router.options = this.options;

    let pipelineSteps = this.pipelineSteps;
    if (pipelineSteps.length) {
      if (!router.isRoot) {
        throw new Error('Pipeline steps can only be added to the root router');
      }

      let filterContainer = router.container.get(RouteFilterContainer);
      for (let i = 0, ii = pipelineSteps.length; i < ii; ++i) {
        let {name, step} = pipelineSteps[i];
        filterContainer.addStep(name, step);
      }
    }
  }
}

export const activationStrategy = {
  noChange: 'no-change',
  invokeLifecycle: 'invoke-lifecycle',
  replace: 'replace'
};

export function buildNavigationPlan(navigationContext: NavigationContext, forceLifecycleMinimum): Promise<Object> {
  let prev = navigationContext.prevInstruction;
  let next = navigationContext.nextInstruction;
  let plan = {};

  if ('redirect' in next.config) {
    let redirectLocation = resolveUrl(next.config.redirect, getInstructionBaseUrl(next));
    if (next.queryString) {
      redirectLocation += '?' + next.queryString;
    }

    return Promise.reject(new Redirect(redirectLocation));
  }

  if (prev) {
    let newParams = hasDifferentParameterValues(prev, next);
    let pending = [];

    for (let viewPortName in prev.viewPortInstructions) {
      let prevViewPortInstruction = prev.viewPortInstructions[viewPortName];
      let nextViewPortConfig = next.config.viewPorts[viewPortName];
      let viewPortPlan = plan[viewPortName] = {
        name: viewPortName,
        config: nextViewPortConfig,
        prevComponent: prevViewPortInstruction.component,
        prevModuleId: prevViewPortInstruction.moduleId
      };

      if (prevViewPortInstruction.moduleId !== nextViewPortConfig.moduleId) {
        viewPortPlan.strategy = activationStrategy.replace;
      } else if ('determineActivationStrategy' in prevViewPortInstruction.component.bindingContext) {
         //TODO: should we tell them if the parent had a lifecycle min change?
        viewPortPlan.strategy = prevViewPortInstruction.component.bindingContext
          .determineActivationStrategy(...next.lifecycleArgs);
      } else if (next.config.activationStrategy) {
        viewPortPlan.strategy = next.config.activationStrategy;
      } else if (newParams || forceLifecycleMinimum) {
        viewPortPlan.strategy = activationStrategy.invokeLifecycle;
      } else {
        viewPortPlan.strategy = activationStrategy.noChange;
      }

      if (viewPortPlan.strategy !== activationStrategy.replace && prevViewPortInstruction.childRouter) {
        let path = next.getWildcardPath();
        let task = prevViewPortInstruction.childRouter
          .createNavigationInstruction(path, next).then(childInstruction => { // eslint-disable-line no-loop-func
            viewPortPlan.childNavigationContext = prevViewPortInstruction.childRouter
              .createNavigationContext(childInstruction);

            return buildNavigationPlan(
              viewPortPlan.childNavigationContext,
              viewPortPlan.strategy === activationStrategy.invokeLifecycle)
              .then(childPlan => {
                viewPortPlan.childNavigationContext.plan = childPlan;
              });
          });

        pending.push(task);
      }
    }

    return Promise.all(pending).then(() => plan);
  }

  for (let viewPortName in next.config.viewPorts) {
    plan[viewPortName] = {
      name: viewPortName,
      strategy: activationStrategy.replace,
      config: next.config.viewPorts[viewPortName]
    };
  }

  return Promise.resolve(plan);
}

export class BuildNavigationPlanStep {
  run(navigationContext: NavigationContext, next: Function) {
    return buildNavigationPlan(navigationContext)
      .then(plan => {
        navigationContext.plan = plan;
        return next();
      }).catch(next.cancel);
  }
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

  return false;
}

function getInstructionBaseUrl(instruction: NavigationInstruction): string {
  let instructionBaseUrlParts = [];
  instruction = instruction.parentInstruction;

  while (instruction) {
    instructionBaseUrlParts.unshift(instruction.getBaseUrl());
    instruction = instruction.parentInstruction;
  }

  instructionBaseUrlParts.unshift('/');
  return instructionBaseUrlParts.join('');
}

export class CanDeactivatePreviousStep {
  run(navigationContext: NavigationContext, next: Function) {
    return processDeactivatable(navigationContext.plan, 'canDeactivate', next);
  }
}

export class CanActivateNextStep {
  run(navigationContext: NavigationContext, next: Function) {
    return processActivatable(navigationContext, 'canActivate', next);
  }
}

export class DeactivatePreviousStep {
  run(navigationContext: NavigationContext, next: Function) {
    return processDeactivatable(navigationContext.plan, 'deactivate', next, true);
  }
}

export class ActivateNextStep {
  run(navigationContext: NavigationContext, next: Function) {
    return processActivatable(navigationContext, 'activate', next, true);
  }
}

function processDeactivatable(plan, callbackName, next, ignoreResult) {
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
        let controller = infos[i];
        let result = controller[callbackName]();
        return processPotential(result, inspect, next.cancel);
      } catch (error) {
        return next.cancel(error);
      }
    }

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
      let controller = prevComponent.bindingContext;

      if (callbackName in controller) {
        list.push(controller);
      }
    }

    if (viewPortPlan.childNavigationContext) {
      findDeactivatable(viewPortPlan.childNavigationContext.plan, callbackName, list);
    } else if (prevComponent) {
      addPreviousDeactivatable(prevComponent, callbackName, list);
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
      let prevController = prevComponent.bindingContext;

      if (callbackName in prevController) {
        list.push(prevController);
      }

      addPreviousDeactivatable(prevComponent, callbackName, list);
    }
  }
}

function processActivatable(navigationContext: NavigationContext, callbackName: any, next: Function, ignoreResult: boolean) {
  let infos = findActivatable(navigationContext, callbackName);
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
        let result = current.controller[callbackName](...current.lifecycleArgs);
        return processPotential(result, val => inspect(val, current.router), next.cancel);
      } catch (error) {
        return next.cancel(error);
      }
    }

    return next();
  }

  return iterate();
}

function findActivatable(navigationContext: NavigationContext, callbackName: string, list: Array<Object> = [], router: Router): Array<Object> {
  let plan = navigationContext.plan;
  let next = navigationContext.nextInstruction;

  Object.keys(plan).filter((viewPortName) => {
    let viewPortPlan = plan[viewPortName];
    let viewPortInstruction = next.viewPortInstructions[viewPortName];
    let controller = viewPortInstruction.component.bindingContext;

    if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle || viewPortPlan.strategy === activationStrategy.replace) && callbackName in controller) {
      list.push({
        controller: controller,
        lifecycleArgs: viewPortInstruction.lifecycleArgs,
        router: router
      });
    }

    if (viewPortPlan.childNavigationContext) {
      findActivatable(
        viewPortPlan.childNavigationContext,
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

export class NavigationContext {
  constructor(router: Router, nextInstruction: NavigationInstruction) {
    this.router = router;
    this.nextInstruction = nextInstruction;
    this.currentInstruction = router.currentInstruction;
    this.prevInstruction = router.currentInstruction;
  }

  getAllContexts(acc?: Array<NavigationContext> = []): Array<NavigationContext> {
    acc.push(this);
    if (this.plan) {
      for (let key in this.plan) {
        this.plan[key].childNavigationContext && this.plan[key].childNavigationContext.getAllContexts(acc);
      }
    }
    return acc;
  }

  get nextInstructions(): Array<NavigationInstruction> {
    return this.getAllContexts().map(c => c.nextInstruction).filter(c => c);
  }

  get currentInstructions(): Array<NavigationInstruction> {
    return this.getAllContexts().map(c => c.currentInstruction).filter(c => c);
  }

  get prevInstructions(): Array<NavigationInstruction> {
    return this.getAllContexts().map(c => c.prevInstruction).filter(c => c);
  }

  commitChanges(waitToSwap: boolean) {
    let next = this.nextInstruction;
    let prev = this.prevInstruction;
    let viewPortInstructions = next.viewPortInstructions;
    let router = this.router;
    let loads = [];
    let delaySwaps = [];

    router.currentInstruction = next;

    if (prev) {
      prev.config.navModel.isActive = false;
    }

    next.config.navModel.isActive = true;

    router.refreshBaseUrl();
    router.refreshNavigation();

    for (let viewPortName in viewPortInstructions) {
      let viewPortInstruction = viewPortInstructions[viewPortName];
      let viewPort = router.viewPorts[viewPortName];

      if (!viewPort) {
        throw new Error(`There was no router-view found in the view for ${viewPortInstruction.moduleId}.`);
      }

      if (viewPortInstruction.strategy === activationStrategy.replace) {
        if (waitToSwap) {
          delaySwaps.push({viewPort, viewPortInstruction});
        }

        loads.push(viewPort.process(viewPortInstruction, waitToSwap).then((x) => {
          if ('childNavigationContext' in viewPortInstruction) {
            return viewPortInstruction.childNavigationContext.commitChanges();
          }
        }));
      } else {
        if ('childNavigationContext' in viewPortInstruction) {
          loads.push(viewPortInstruction.childNavigationContext.commitChanges(waitToSwap));
        }
      }
    }

    return Promise.all(loads).then(() => {
      delaySwaps.forEach(x => x.viewPort.swap(x.viewPortInstruction));
    });
  }

  updateTitle(): void {
    let title = this.buildTitle();
    if (title) {
      DOM.title = title;
    }
  }

  buildTitle(separator: string = ' | '): string {
    let next = this.nextInstruction;
    let title = next.config.navModel.title || '';
    let viewPortInstructions = next.viewPortInstructions;
    let childTitles = [];

    for (let viewPortName in viewPortInstructions) {
      let viewPortInstruction = viewPortInstructions[viewPortName];

      if ('childNavigationContext' in viewPortInstruction) {
        let childTitle = viewPortInstruction.childNavigationContext.buildTitle(separator);
        if (childTitle) {
          childTitles.push(childTitle);
        }
      }
    }

    if (childTitles.length) {
      title = childTitles.join(separator) + (title ? separator : '') + title;
    }

    if (this.router.title) {
      title += (title ? separator : '') + this.router.title;
    }

    return title;
  }
}

export class CommitChangesStep {
  run(navigationContext: NavigationContext, next: Function) {
    return navigationContext.commitChanges(true).then(() => {
      navigationContext.updateTitle();
      return next();
    });
  }
}

export class RouteLoader {
  loadRoute(router: any, config: any, navigationContext: any) {
    throw Error('Route loaders must implement "loadRoute(router, config, navigationContext)".');
  }
}

export class LoadRouteStep {
  static inject() { return [RouteLoader]; }

  constructor(routeLoader: RouteLoader) {
    this.routeLoader = routeLoader;
  }

  run(navigationContext: NavigationContext, next: Function) {
    return loadNewRoute(this.routeLoader, navigationContext)
      .then(next)
      .catch(next.cancel);
  }
}

export function loadNewRoute(routeLoader: RouteLoader, navigationContext: NavigationContext) {
  let toLoad = determineWhatToLoad(navigationContext);
  let loadPromises = toLoad.map((current) => loadRoute(
    routeLoader,
    current.navigationContext,
    current.viewPortPlan
    )
  );

  return Promise.all(loadPromises);
}

function determineWhatToLoad(navigationContext: NavigationContext, toLoad: Array<Object> = []) {
  let plan = navigationContext.plan;
  let next = navigationContext.nextInstruction;

  for (let viewPortName in plan) {
    let viewPortPlan = plan[viewPortName];

    if (viewPortPlan.strategy === activationStrategy.replace) {
      toLoad.push({
        viewPortPlan: viewPortPlan,
        navigationContext: navigationContext
      });

      if (viewPortPlan.childNavigationContext) {
        determineWhatToLoad(viewPortPlan.childNavigationContext, toLoad);
      }
    } else {
      let viewPortInstruction = next.addViewPortInstruction(
          viewPortName,
          viewPortPlan.strategy,
          viewPortPlan.prevModuleId,
          viewPortPlan.prevComponent
          );

      if (viewPortPlan.childNavigationContext) {
        viewPortInstruction.childNavigationContext = viewPortPlan.childNavigationContext;
        determineWhatToLoad(viewPortPlan.childNavigationContext, toLoad);
      }
    }
  }

  return toLoad;
}

function loadRoute(routeLoader: RouteLoader, navigationContext: NavigationContext, viewPortPlan: any) {
  let moduleId = viewPortPlan.config.moduleId;
  let next = navigationContext.nextInstruction;

  return loadComponent(routeLoader, navigationContext, viewPortPlan.config).then((component) => {
    let viewPortInstruction = next.addViewPortInstruction(
      viewPortPlan.name,
      viewPortPlan.strategy,
      moduleId,
      component
      );

    let childRouter = component.childRouter;
    if (childRouter) {
      let path = next.getWildcardPath();

      return childRouter.createNavigationInstruction(path, next)
        .then((childInstruction) => {
          let childNavigationContext = childRouter.createNavigationContext(childInstruction);
          viewPortPlan.childNavigationContext = childNavigationContext;

          return buildNavigationPlan(childNavigationContext)
            .then((childPlan) => {
              childNavigationContext.plan = childPlan;
              viewPortInstruction.childNavigationContext = childNavigationContext;

              return loadNewRoute(routeLoader, childNavigationContext);
            });
        });
    }
  });
}

function loadComponent(routeLoader: RouteLoader, navigationContext: NavigationContext, config: any) {
  let router = navigationContext.router;
  let lifecycleArgs = navigationContext.nextInstruction.lifecycleArgs;

  return routeLoader.loadRoute(router, config, navigationContext).then((component) => {
    let {bindingContext, childContainer} = component;
    component.router = router;
    component.config = config;

    if ('configureRouter' in bindingContext) {
      let childRouter = childContainer.getChildRouter();
      component.childRouter = childRouter;

      return childRouter.configure(c => bindingContext.configureRouter(c, childRouter, ...lifecycleArgs))
        .then(() => component);
    }

    return component;
  });
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
  viewPorts: Object = {};
  fallbackOrder: number = 100;
  recognizer: RouteRecognizer = new RouteRecognizer();
  childRecognizer: RouteRecognizer = new RouteRecognizer();
  routes: RouteConfig[] = [];

  /**
  * The [[Router]]'s current base URL, typically based on the [[Router.currentInstruction]].
  */
  baseUrl: string = '';

  /**
  * True if the [[Router]] has been configured.
  */
  isConfigured: boolean = false;

  /**
  * True if the [[Router]] is currently processing a navigation.
  */
  isNavigating: boolean = false;

  /**
  * The navigation models for routes that specified [[RouteConfig.nav]].
  */
  navigation: NavModel[] = [];

  /**
  * The currently active navigation instruction.
  */
  currentInstruction: NavigationInstruction;

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
  * Gets a valid indicating whether or not this [[Router]] is the root in the router tree. I.e., it has no parent.
  */
  get isRoot(): boolean {
    return false;
  }

  /**
  * Registers a viewPort to be used as a rendering target for activated routes.
  *
  * @param viewPort The viewPort.
  * @param name The name of the viewPort. 'default' if unspecified.
  */
  registerViewPort(viewPort: Object, name?: string): void {
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
      (c || config).exportToRouter(this);
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
  navigate(fragment: string, options?: Object): boolean {
    if (!this.isConfigured && this.parent) {
      return this.parent.navigate(fragment, options);
    }

    return this.history.navigate(resolveUrl(fragment, this.baseUrl, this.history._hasPushState), options);
  }

  /**
  * Navigates to a new location corresponding to the route and params specified. Equivallent to [[Router.generate]] followed
  * by [[Router.navigate]].
  *
  * @param route The name of the route to use when generating the navigation location.
  * @param params The route parameters to be used when populating the route pattern.
  * @param options The navigation options.
  */
  navigateToRoute(route: string, params?: Object, options?: Object): boolean {
    let path = this.generate(route, params);
    return this.navigate(path, options);
  }

  /**
  * Navigates back to the most recent location in history.
  */
  navigateBack() {
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
  * @returns {string} A string containing the generated URL fragment.
  */
  generate(name: string, params?: Object): string {
    let hasRoute = this.recognizer.hasRoute(name);
    if ((!this.isConfigured || !hasRoute) && this.parent) {
      return this.parent.generate(name, params);
    }

    if (!hasRoute) {
      throw new Error(`A route with name '${name}' could not be found. Check that \`name: '${name}'\` was specified in the route's config.`);
    }

    let path = this.recognizer.generate(name, params);
    return createRootedPath(path, this.baseUrl, this.history._hasPushState);
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
    validateRouteConfig(config);

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

    let state = this.recognizer.add({path: path, handler: config});

    if (path) {
      let settings = config.settings;
      delete config.settings;
      let withChild = JSON.parse(JSON.stringify(config));
      config.settings = settings;
      withChild.route = `${path}/*childRoute`;
      withChild.hasChildRouter = true;
      this.childRecognizer.add({
        path: withChild.route,
        handler: withChild
      });

      withChild.navModel = navModel;
      withChild.settings = config.settings;
    }

    config.navModel = navModel;

    if ((navModel.order || navModel.order === 0) && this.navigation.indexOf(navModel) === -1) {
      if ((!navModel.href && navModel.href !== '') && (state.types.dynamics || state.types.stars)) {
        throw new Error('Invalid route config: dynamic routes must specify an href to be included in the navigation model.');
      }

      if (typeof navModel.order !== 'number') {
        navModel.order = ++this.fallbackOrder;
      }

      this.navigation.push(navModel);
      this.navigation = this.navigation.sort((a, b) => a.order - b.order);
    }
  }

  /**
  * Gets a value indicating whether or not this [[Router]] or one of its ancestors has a route registered with the specified name.
  *
  * @param name The name of the route to check.
  * @returns {boolean}
  */
  hasRoute(name: string): boolean {
    return !!(this.recognizer.hasRoute(name) || this.parent && this.parent.hasRoute(name));
  }

  /**
  * Gets a value indicating whether or not this [[Router]] has a route registered with the specified name.
  *
  * @param name The name of the route to check.
  * @returns {boolean}
  */
  hasOwnRoute(name: string): boolean {
    return this.recognizer.hasRoute(name);
  }

  /**
  * Register a handler to use when the incoming URL fragment doesn't match any registered routes.
  *
  * @param config The moduleId, or a function that selects the moduleId, or a [[RouteConfig]].
  */
  handleUnknownRoutes(config?: string|Function|RouteConfig): void {
    let callback = instruction => new Promise((resolve, reject) => {
      function done(inst) {
        inst = inst || instruction;
        inst.config.route = inst.params.path;
        resolve(inst);
      }

      if (!config) {
        instruction.config.moduleId = instruction.fragment;
        done(instruction);
      } else if (typeof config === 'string') {
        instruction.config.moduleId = config;
        done(instruction);
      } else if (typeof config === 'function') {
        processPotential(config(instruction), done, reject);
      } else {
        instruction.config = config;
        done(instruction);
      }
    });

    this.catchAllHandler = callback;
  }

  /**
  * Updates the document title using the current navigation instruction.
  */
  updateTitle(): void {
    if (this.parent) {
      return this.parent.updateTitle();
    }

    this.currentInstruction.navigationContext.updateTitle();
  }

  /**
  * Resets the Router to its original unconfigured state.
  */
  reset(): void {
    this.fallbackOrder = 100;
    this.recognizer = new RouteRecognizer();
    this.childRecognizer = new RouteRecognizer();
    this.routes = [];
    this.isNavigating = false;
    this.navigation = [];

    if (this.isConfigured || !this._configuredPromise) {
      this._configuredPromise = new Promise(resolve => {
        this._resolveConfiguredPromise = resolve;
      });
    }

    this.isConfigured = false;
  }

  refreshBaseUrl(): void {
    if (this.parent) {
      let baseUrl = this.parent.currentInstruction.getBaseUrl();
      this.baseUrl = this.parent.baseUrl + baseUrl;
    }
  }

  refreshNavigation(): void {
    let nav = this.navigation;

    for (let i = 0, length = nav.length; i < length; i++) {
      let current = nav[i];
      if (!current.href) {
        current.href = createRootedPath(current.relativeHref, this.baseUrl, this.history._hasPushState);
      }
    }
  }

  createNavigationInstruction(url: string = '', parentInstruction: NavigationInstruction = null): Promise<NavigationInstruction> {
    let fragment = url;
    let queryString = '';

    let queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      fragment = url.substr(0, queryIndex);
      queryString = url.substr(queryIndex + 1);
    }

    let results = this.recognizer.recognize(url);
    if (!results || !results.length) {
      results = this.childRecognizer.recognize(url);
    }

    if ((!results || !results.length) && this.catchAllHandler) {
      results = [{
        config: {
          navModel: {}
        },
        handler: this.catchAllHandler,
        params: {
          path: fragment
        }
      }];
    }

    if (results && results.length) {
      let first = results[0];
      let instruction = new NavigationInstruction(
        fragment,
        queryString,
        first.params,
        first.queryParams || results.queryParams,
        first.config || first.handler,
        parentInstruction
        );

      if (typeof first.handler === 'function') {
        return evaluateNavigationStrategy(instruction, first.handler, first);
      } else if (first.handler && 'navigationStrategy' in first.handler) {
        return evaluateNavigationStrategy(instruction, first.handler.navigationStrategy, first.handler);
      }

      return Promise.resolve(instruction);
    }

    return Promise.reject(new Error(`Route not found: ${url}`));
  }

  createNavigationContext(instruction:NavigationInstruction):NavigationContext {
    instruction.navigationContext = new NavigationContext(this, instruction);
    return instruction.navigationContext;
  }
}

function validateRouteConfig(config: Object): void {
  if (typeof config !== 'object') {
    throw new Error('Invalid Route Config');
  }

  if (typeof config.route !== 'string') {
    throw new Error('Invalid Route Config: You must specify a route pattern.');
  }

  if (!('redirect' in config || config.moduleId || config.navigationStrategy || config.viewPorts)) {
    throw new Error('Invalid Route Config: You must specify a moduleId, redirect, navigationStrategy, or viewPorts.');
  }
}

function evaluateNavigationStrategy(instruction: NavigationInstruction, evaluator: Function, context: Object): Promise<NavigationInstruction> {
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

  createPipeline(navigationContext: NavigationContext): Pipeline {
    let pipeline = new Pipeline();
    this.steps.forEach(step => pipeline.withStep(this.container.get(step)));
    return pipeline;
  }
}

const logger = LogManager.getLogger('app-router');

export class AppRouter extends Router {
  static inject() { return [Container, History, PipelineProvider, EventAggregator]; }

  constructor(container: Container, history: History, pipelineProvider: PipelineProvider, events: EventAggregator) {
    super(container, history);
    this.pipelineProvider = pipelineProvider;
    this.events = events;
    this.maxInstructionCount = 10;
  }

  get isRoot(): boolean {
    return true;
  }

  loadUrl(url): Promise<NavigationInstruction> {
    return this.createNavigationInstruction(url)
      .then(instruction => this.queueInstruction(instruction))
      .catch(error => {
        logger.error(error);
        restorePreviousLocation(this);
      });
  }

  queueInstruction(instruction: NavigationInstruction): Promise<any> {
    return new Promise((resolve) => {
      instruction.resolve = resolve;
      this.queue.unshift(instruction);
      this.dequeueInstruction();
    });
  }

  dequeueInstruction(instructionCount: number = 0): Promise<any> {
    return Promise.resolve().then(() => {
      if (this.isNavigating && !instructionCount) {
        return undefined;
      }

      let instruction = this.queue.shift();
      this.queue = [];

      if (!instruction) {
        return undefined;
      }

      this.isNavigating = true;

      if (!instructionCount) {
        this.events.publish('router:navigation:processing', { instruction });
      } else if (instructionCount === this.maxInstructionCount - 1) {
        logger.error(`${instructionCount + 1} navigation instructions have been attempted without success. Restoring last known good location.`);
        restorePreviousLocation(this);
        return this.dequeueInstruction(instructionCount + 1);
      } else if (instructionCount > this.maxInstructionCount) {
        throw new Error(`Maximum navigation attempts exceeded. Giving up.`);
      }

      let context = this.createNavigationContext(instruction);
      let pipeline = this.pipelineProvider.createPipeline(context);

      return pipeline
        .run(context)
        .then(result => processResult(instruction, result, instructionCount, this))
        .catch(error => {
          return { output: error instanceof Error ? error : new Error(error) };
        })
        .then(result => resolveInstruction(instruction, result, !!instructionCount, this));
    });
  }

  registerViewPort(viewPort: Object, name: string): void {
    super.registerViewPort(viewPort, name);

    if (!this.isActive) {
      let viewModel = this._findViewModel(viewPort);
      if ('configureRouter' in viewModel) {
        if (!this.isConfigured) {
          return this.configure(config => viewModel.configureRouter(config, this))
            .then(() => { this.activate(); });
        }
      } else {
        this.activate();
      }
    } else {
      this.dequeueInstruction();
    }

    return Promise.resolve();
  }

  _findViewModel(viewPort: Object) {
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
  }

  activate(options: Object): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
    this.history.activate(this.options);
    this.dequeueInstruction();
  }

  deactivate(): void {
    this.isActive = false;
    this.history.deactivate();
  }

  reset(): void {
    super.reset();
    this.queue = [];
    this.options = null;
  }
}

function processResult(instruction, result, instructionCount, router) {
  if (!(result && 'completed' in result && 'output' in result)) {
    result = result || {};
    result.output = new Error(`Expected router pipeline to return a navigation result, but got [${JSON.stringify(result)}] instead.`);
  }

  let finalResult = null;
  if (isNavigationCommand(result.output)) {
    result.output.navigate(router);
  } else {
    finalResult = result;

    if (!result.completed) {
      if (result.output instanceof Error) {
        logger.error(result.output);
      }

      restorePreviousLocation(router);
    }
  }

  return router.dequeueInstruction(instructionCount + 1)
    .then(innerResult => finalResult || innerResult || result);
}

function resolveInstruction(instruction, result, isInnerInstruction, router) {
  instruction.resolve(result);

  if (!isInnerInstruction) {
    router.isNavigating = false;
    let eventArgs = { instruction, result };
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
  }

  return result;
}

function restorePreviousLocation(router) {
  let previousLocation = router.history.previousLocation;
  if (previousLocation) {
    router.navigate(router.history.previousLocation, { trigger: false, replace: true });
  } else {
    logger.error('Router navigation failed, and no previous location could be restored.');
  }
}
