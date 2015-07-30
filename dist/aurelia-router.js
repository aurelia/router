import core from 'core-js';
import {Container} from 'aurelia-dependency-injection';
import {RouteRecognizer} from 'aurelia-route-recognizer';
import {join} from 'aurelia-path';
import {History} from 'aurelia-history';
import {EventAggregator} from 'aurelia-event-aggregator';

export function processPotential(obj, resolve, reject){
  if(obj && typeof obj.then === 'function'){
    var dfd = obj.then(resolve);

    if(typeof dfd.catch === 'function'){
      return dfd.catch(reject);
    } else if(typeof dfd.fail === 'function'){
      return dfd.fail(reject);
    }

    return dfd;
  } else{
    try{
      return resolve(obj);
    }catch(error){
      return reject(error);
    }
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

  if ((!path.length || path[path.length - 1] != '/') && fragment[0] != '/') {
    path += '/';
  }

  if (path.length && path[path.length - 1] == '/' && fragment[0] == '/') {
    path = path.substring(0, path.length - 1);
  }

  return normalizeAbsolutePath(path + fragment, hasPushState);
}

export function resolveUrl(fragment, baseUrl, hasPushState) {
  if (isRootedPath.test(fragment)) {
    return normalizeAbsolutePath(fragment, hasPushState);
  } else {
    return createRootedPath(fragment, baseUrl, hasPushState);
  }
}

const isRootedPath = /^#?\//;
const isAbsoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;

/**
 * Determines if the provided object is a navigation command.
 * A navigation command is anything with a navigate method.
 * @param {object} obj The item to check.
 * @return {boolean}
 */
export function isNavigationCommand(obj){
  return obj && typeof obj.navigate === 'function';
}

/**
* Used during the activation lifecycle to cause a redirect.
*
* @class Redirect
* @constructor
* @param {String} url The url to redirect to.
*/
export class Redirect{
  constructor(url, options) {
    this.url = url;
    this.options = Object.assign({ trigger: true, replace: true }, options || {});
    this.shouldContinueProcessing = false;
  }

  /**
  * Called by the activation system to set the child router.
  *
  * @method setRouter
  * @param {Router} router
  */
  setRouter(router){
    this.router = router;
  }

  /**
  * Called by the navigation pipeline to navigate.
  *
  * @method navigate
  * @param {Router} appRouter - a router which should redirect
  */
  navigate(appRouter){
    var navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
    navigatingRouter.navigate(this.url, this.options);
  }
}

export const activationStrategy = {
  noChange: 'no-change',
  invokeLifecycle: 'invoke-lifecycle',
  replace: 'replace'
};

export function buildNavigationPlan(navigationContext, forceLifecycleMinimum) {
  var prev = navigationContext.prevInstruction;
  var next = navigationContext.nextInstruction;
  var plan = {}, viewPortName;

  if ('redirect' in next.config) {
    let redirectLocation = resolveUrl(next.config.redirect, getInstructionBaseUrl(next));
    if (next.queryString) {
      redirectLocation += '?' + next.queryString;
    }

    return Promise.reject(new Redirect(redirectLocation));
  }

  if (prev) {
    var newParams = hasDifferentParameterValues(prev, next);
    var pending = [];

    for (viewPortName in prev.viewPortInstructions) {
      var prevViewPortInstruction = prev.viewPortInstructions[viewPortName];
      var nextViewPortConfig = next.config.viewPorts[viewPortName];
      var viewPortPlan = plan[viewPortName] = {
        name: viewPortName,
        config: nextViewPortConfig,
        prevComponent: prevViewPortInstruction.component,
        prevModuleId: prevViewPortInstruction.moduleId
      };

      if (prevViewPortInstruction.moduleId != nextViewPortConfig.moduleId) {
        viewPortPlan.strategy = activationStrategy.replace;
      } else if ('determineActivationStrategy' in prevViewPortInstruction.component.executionContext) {
         //TODO: should we tell them if the parent had a lifecycle min change?
        viewPortPlan.strategy = prevViewPortInstruction.component.executionContext
          .determineActivationStrategy(...next.lifecycleArgs);
      } else if (newParams || forceLifecycleMinimum) {
        viewPortPlan.strategy = activationStrategy.invokeLifecycle;
      } else {
        viewPortPlan.strategy = activationStrategy.noChange;
      }

      if (viewPortPlan.strategy !== activationStrategy.replace && prevViewPortInstruction.childRouter) {
        var path = next.getWildcardPath();
        var task = prevViewPortInstruction.childRouter
          .createNavigationInstruction(path, next).then(childInstruction => {
            viewPortPlan.childNavigationContext = prevViewPortInstruction.childRouter
              .createNavigationContext(childInstruction);

            return buildNavigationPlan(
              viewPortPlan.childNavigationContext, 
              viewPortPlan.strategy == activationStrategy.invokeLifecycle)
              .then(childPlan => {
                viewPortPlan.childNavigationContext.plan = childPlan;
              });
          });

        pending.push(task);
      }
    }

    return Promise.all(pending).then(() => plan);
  }else{
    for (viewPortName in next.config.viewPorts) {
      plan[viewPortName] = {
        name: viewPortName,
        strategy: activationStrategy.replace,
        config: next.config.viewPorts[viewPortName]
      };
    }

    return Promise.resolve(plan);
  }
}

export class BuildNavigationPlanStep {
  run(navigationContext, next) {
    return buildNavigationPlan(navigationContext)
      .then(plan => {
        navigationContext.plan = plan;
        return next();
      }).catch(next.cancel);
  }
}

function hasDifferentParameterValues(prev, next) {
  var prevParams = prev.params,
      nextParams = next.params,
      nextWildCardName = next.config.hasChildRouter ? next.getWildCardName() : null;

  for (var key in nextParams) {
    if (key === nextWildCardName) {
      continue;
    }

    if (prevParams[key] !== nextParams[key]) {
      return true;
    }
  }

  for (var key in prevParams) {
    if (key === nextWildCardName) {
      continue;
    }

    if (prevParams[key] !== nextParams[key]) {
      return true;
    }
  }

  return false;
}

function getInstructionBaseUrl(instruction) {
    let instructionBaseUrlParts = [];
    while(instruction = instruction.parentInstruction) {
      instructionBaseUrlParts.unshift(instruction.getBaseUrl());
    }

    instructionBaseUrlParts.unshift('/');
    return instructionBaseUrlParts.join('');
}

export var affirmations = ['yes', 'ok', 'true'];

export class CanDeactivatePreviousStep {
  run(navigationContext, next) {
    return processDeactivatable(navigationContext.plan, 'canDeactivate', next);
  }
}

export class CanActivateNextStep {
  run(navigationContext, next) {
    return processActivatable(navigationContext, 'canActivate', next);
  }
}

export class DeactivatePreviousStep {
  run(navigationContext, next) {
    return processDeactivatable(navigationContext.plan, 'deactivate', next, true);
  }
}

export class ActivateNextStep {
  run(navigationContext, next) {
    return processActivatable(navigationContext, 'activate', next, true);
  }
}

function processDeactivatable(plan, callbackName, next, ignoreResult) {
  var infos = findDeactivatable(plan, callbackName),
      i = infos.length; //query from inside out

  function inspect(val) {
    if (ignoreResult || shouldContinue(val)) {
      return iterate();
    } else {
      return next.cancel(val);
    }
  }

  function iterate() {
    if (i--) {
      try{
        var controller = infos[i];
        var result = controller[callbackName]();
        return processPotential(result, inspect, next.cancel);
      }catch(error){
        return next.cancel(error);
      }
    } else {
      return next();
    }
  }

  return iterate();
}

function findDeactivatable(plan, callbackName, list) {
  list = list || [];

  for (var viewPortName in plan) {
    var viewPortPlan = plan[viewPortName];
    var prevComponent = viewPortPlan.prevComponent;

    if ((viewPortPlan.strategy == activationStrategy.invokeLifecycle ||
        viewPortPlan.strategy == activationStrategy.replace) &&
        prevComponent) {

      var controller = prevComponent.executionContext;

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

function addPreviousDeactivatable(component, callbackName, list) {
  var controller = component.executionContext,
      childRouter = component.childRouter;

  if (childRouter && childRouter.currentInstruction) {
    var viewPortInstructions = childRouter.currentInstruction.viewPortInstructions;

    for (var viewPortName in viewPortInstructions) {
      var viewPortInstruction = viewPortInstructions[viewPortName];
      var prevComponent = viewPortInstruction.component;
      var prevController = prevComponent.executionContext;

      if (callbackName in prevController) {
        list.push(prevController);
      }

      addPreviousDeactivatable(prevComponent, callbackName, list);
    }
  }
}

function processActivatable(navigationContext, callbackName, next, ignoreResult) {
  var infos = findActivatable(navigationContext, callbackName),
      length = infos.length,
      i = -1; //query from top down

  function inspect(val, router) {
    if (ignoreResult || shouldContinue(val, router)) {
      return iterate();
    } else {
      return next.cancel(val);
    }
  }

  function iterate() {
    i++;

    if (i < length) {
      try{
        var current = infos[i];
        var result = current.controller[callbackName](...current.lifecycleArgs);
        return processPotential(result, val => inspect(val, current.router), next.cancel);
      }catch(error){
        return next.cancel(error);
      }
    } else {
      return next();
    }
  }

  return iterate();
}

function findActivatable(navigationContext, callbackName, list, router) {
  var plan = navigationContext.plan;
  var next = navigationContext.nextInstruction;

  list = list || [];

  Object.keys(plan).filter(viewPortName => {
    var viewPortPlan = plan[viewPortName];
    var viewPortInstruction = next.viewPortInstructions[viewPortName];
    var controller = viewPortInstruction.component.executionContext;

    if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle || viewPortPlan.strategy === activationStrategy.replace) && callbackName in controller) {
      list.push({
        controller:controller,
        lifecycleArgs:viewPortInstruction.lifecycleArgs,
        router:router
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

function shouldContinue(output, router) {
  if(output instanceof Error) {
    return false;
  }

  if(isNavigationCommand(output)){
    if(typeof output.setRouter === 'function') {
      output.setRouter(router);
    }

    return !!output.shouldContinueProcessing;
  }

  if(typeof output === 'string') {
    return affirmations.indexOf(output.toLowerCase()) !== -1;
  }

  if(typeof output === 'undefined') {
    return true;
  }

  return output;
}

export class NavigationContext {
  constructor(router, nextInstruction) {
    this.router = router;
    this.nextInstruction = nextInstruction;
    this.currentInstruction = router.currentInstruction;
    this.prevInstruction = router.currentInstruction;
  }

  getAllContexts(acc = []) {
    acc.push(this);
    if(this.plan) {
      for (var key in this.plan) {
        this.plan[key].childNavigationContext && this.plan[key].childNavigationContext.getAllContexts(acc);
      }
    }
    return acc;
  }

  get nextInstructions() {
    return this.getAllContexts().map(c => c.nextInstruction).filter(c => c);
  }

  get currentInstructions() {
    return this.getAllContexts().map(c => c.currentInstruction).filter(c => c);
  }

  get prevInstructions() {
    return this.getAllContexts().map(c => c.prevInstruction).filter(c => c);
  }

  commitChanges(waitToSwap) {
    var next = this.nextInstruction,
        prev = this.prevInstruction,
        viewPortInstructions = next.viewPortInstructions,
        router = this.router,
        loads = [],
        delaySwaps = [];

    router.currentInstruction = next;

    if (prev) {
      prev.config.navModel.isActive = false;
    }

    next.config.navModel.isActive = true;

    router.refreshBaseUrl();
    router.refreshNavigation();

    for (var viewPortName in viewPortInstructions) {
      var viewPortInstruction = viewPortInstructions[viewPortName];
      var viewPort = router.viewPorts[viewPortName];

      if(!viewPort){
        throw new Error(`There was no router-view found in the view for ${viewPortInstruction.moduleId}.`);
      }

      if (viewPortInstruction.strategy === activationStrategy.replace) {
        if(waitToSwap){
          delaySwaps.push({viewPort, viewPortInstruction});
        }

        loads.push(viewPort.process(viewPortInstruction, waitToSwap).then(x => {
          if ('childNavigationContext' in viewPortInstruction) {
            return viewPortInstruction.childNavigationContext.commitChanges();
          }
        }));
      }else{
        if ('childNavigationContext' in viewPortInstruction) {
          loads.push(viewPortInstruction.childNavigationContext.commitChanges(waitToSwap));
        }
      }
    }

    return Promise.all(loads).then(() => {
      delaySwaps.forEach(x => x.viewPort.swap(x.viewPortInstruction));
    });
  }

  updateTitle() {
    let title = this.buildTitle();
    if (title) {
      document.title = title;
    }
  }

  buildTitle(separator=' | ') {
    var next = this.nextInstruction,
        title = next.config.navModel.title || '',
        viewPortInstructions = next.viewPortInstructions,
        childTitles = [];

    for (var viewPortName in viewPortInstructions) {
      var viewPortInstruction = viewPortInstructions[viewPortName];

      if ('childNavigationContext' in viewPortInstruction) {
        var childTitle = viewPortInstruction.childNavigationContext.buildTitle(separator);
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
  run(navigationContext, next) {
    return navigationContext.commitChanges(true).then(() => {
      navigationContext.updateTitle();
      return next();
    });
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
    } while(current);

    let allParams = Object.assign({}, queryParams, ...ancestorParams);
    this.lifecycleArgs = [allParams, config, this];
  }

  addViewPortInstruction(viewPortName, strategy, moduleId, component): any {
    return this.viewPortInstructions[viewPortName] = {
      name: viewPortName,
      strategy: strategy,
      moduleId: moduleId,
      component: component,
      childRouter: component.childRouter,
      lifecycleArgs: this.lifecycleArgs.slice()
    };
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
 * Class for storing and interacting with a route's navigation settings
 *
 * @class NavModel
 * @constructor
 */
export class NavModel {
  constructor(router, relativeHref) {
    this.router = router;
    this.relativeHref = relativeHref;

    /**
     * True if this nav item is currently active.
     * 
     * @property {Boolean} isActive
     */
    this.isActive = false;

    /**
     * The title.
     * 
     * @property {String} title
     */
    this.title = null;

    /**
     * This nav item's absolute href.
     *  
     * @property {String} href
     */
    this.href = null;

    /**
     * Data attached to the route at configuration time.
     *
     * @property {any} settings
     */
    this.settings = {};

    /**
     * The route config.
     *
     * @property {Object} config
     */
    this.config = null;
  }

  /**
   * Sets the route's title and updates document.title.
   *  If the a navigation is in progress, the change will be applied
   *  to document.title when the navigation completes.
   *
   * @method setTitle
   * @param {String} title The new title.
   */
  setTitle(title) {
    this.title = title;

    if (this.isActive) {
      this.router.updateTitle();
    }
  }
}
export class RouteFilterContainer {
  static inject(){ return [Container]; }
  constructor(container) {
    this.container = container;
    this.filters = { };
    this.filterCache = { };
  }

  addStep(name, step, index = -1) {
    var filter = this.filters[name];
    if (!filter) {
      filter = this.filters[name] = [];
    }

    if (index === -1) {
      index = filter.length;
    }

    filter.splice(index, 0, step);
    this.filterCache = {};
  }

  getFilterSteps(name) {
    if (this.filterCache[name]) {
      return this.filterCache[name];
    }

    var steps = [];
    var filter = this.filters[name];
    if (!filter) {
      return steps;
    }

    for (var i = 0, l = filter.length; i < l; i++) {
      if (typeof filter[i] === 'string') {
        steps.push(...this.getFilterSteps(filter[i]));
      } else {
        steps.push(this.container.get(filter[i]));
      }
    }

    return this.filterCache[name] = steps;
  }
}

export function createRouteFilterStep(name) {
  function create(routeFilterContainer) {
    return new RouteFilterStep(name, routeFilterContainer);
  };
  create.inject = function() {
    return [RouteFilterContainer];
  };
  return create;
}

class RouteFilterStep {
  constructor(name, routeFilterContainer) {
    this.name = name;
    this.routeFilterContainer = routeFilterContainer;
    this.isMultiStep = true;
  }

  getSteps() {
    return this.routeFilterContainer.getFilterSteps(this.name);
  }
}
export class RouterConfiguration{
  instructions = [];
  options = {};
  pipelineSteps = [];
  title;
  unknownRouteConfig;

  addPipelineStep(name, step) {
    this.pipelineSteps.push({name, step});
  }

  map(route) {
    if (Array.isArray(route)) {
      route.forEach(this.map.bind(this));
      return this;
    }

    return this.mapRoute(route);
  }

  mapRoute(config) {
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

  mapUnknownRoutes(config) {
    this.unknownRouteConfig = config;
    return this;
  }

  exportToRouter(router) {
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

export class Router {
  container: any;
  history: any;
  viewPorts: any = {};
  baseUrl: string = '';
  isConfigured: boolean = false;
  fallbackOrder: number = 100;
  recognizer: RouteRecognizer = new RouteRecognizer();
  childRecognizer: RouteRecognizer = new RouteRecognizer();
  routes: any[] = [];
  isNavigating: boolean = false;
  navigation: any[] = [];
  currentInstruction: NavigationInstruction;

  constructor(container, history) {
    this.container = container;
    this.history = history;
    this.reset();
  }

  get isRoot() {
    return false;
  }

  registerViewPort(viewPort:Object, name?:string) {
    name = name || 'default';
    this.viewPorts[name] = viewPort;
  }

  refreshBaseUrl() {
    if (this.parent) {
      var baseUrl = this.parent.currentInstruction.getBaseUrl();
      this.baseUrl = this.parent.baseUrl + baseUrl;
    }
  }

  refreshNavigation() {
    var nav = this.navigation;

    for(var i = 0, length = nav.length; i < length; i++) {
      var current = nav[i];
      current.href = createRootedPath(current.relativeHref, this.baseUrl, this.history._hasPushState);
    }
  }

  configure(callbackOrConfig:RouterConfiguration|((config:RouterConfiguration) => RouterConfiguration)):Router {
    this.isConfigured = true;

    if (typeof callbackOrConfig == 'function') {
      var config = new RouterConfiguration();
      callbackOrConfig(config);
      config.exportToRouter(this);
    } else {
      callbackOrConfig.exportToRouter(this);
    }

    return this;
  }

  navigate(fragment:string, options?:Object):boolean {
    if (!this.isConfigured && this.parent) {
      return this.parent.navigate(fragment, options);
    }

    return this.history.navigate(resolveUrl(fragment, this.baseUrl, this.history._hasPushState), options);
  }

  navigateToRoute(route:string, params?:Object, options?:Object):boolean {
    let path = this.generate(route, params);
    return this.navigate(path, options);
  }

  navigateBack() {
    this.history.navigateBack();
  }

  createChild(container?:Container):Router {
    var childRouter = new Router(container || this.container.createChild(), this.history);
    childRouter.parent = this;
    return childRouter;
  }

  createNavigationInstruction(url:string = '', parentInstruction?:NavigationInstruction = null):Promise<NavigationInstruction> {
    let fragment = url;
    let queryString = '';

    let queryIndex = url.indexOf('?');
    if (queryIndex != -1) {
      fragment = url.substr(0, queryIndex);
      queryString = url.substr(queryIndex + 1);
    }

    let results = this.recognizer.recognize(url);
    if (!results || !results.length) {
      results = this.childRecognizer.recognize(url);
    }

    if((!results || !results.length) && this.catchAllHandler) {
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
      } else if(first.handler && 'navigationStrategy' in first.handler){
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

  generate(name:string, params?:Object):string {
    let hasRoute = this.recognizer.hasRoute(name);
    if((!this.isConfigured || !hasRoute) && this.parent){
      return this.parent.generate(name, params);
    }

    if (!hasRoute) {
      throw new Error(`A route with name '${name}' could not be found. Check that \`name: '${name}'\` was specified in the route's config.`);
    }

    let path = this.recognizer.generate(name, params);
    return createRootedPath(path, this.baseUrl, this.history._hasPushState);
  }

  createNavModel(config:Object):NavModel {
    let navModel = new NavModel(this, 'href' in config ? config.href : config.route);
    navModel.title = config.title;
    navModel.order = config.nav;
    navModel.href = config.href;
    navModel.settings = config.settings;
    navModel.config = config;

    return navModel;
  }

  addRoute(config:Object, navModel?:NavModel) {
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
      let withChild, settings = config.settings;
      delete config.settings;
      withChild = JSON.parse(JSON.stringify(config));
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
      if ((!navModel.href && navModel.href != '') && (state.types.dynamics || state.types.stars)) {
          throw new Error('Invalid route config: dynamic routes must specify an href to be included in the navigation model.');
      }

      if (typeof navModel.order != 'number') {
        navModel.order = ++this.fallbackOrder;
      }

      this.navigation.push(navModel);
      this.navigation = this.navigation.sort((a, b) => a.order - b.order);
    }
  }

  hasRoute(name:string):boolean {
    return !!(this.recognizer.hasRoute(name) || this.parent && this.parent.hasRoute(name));
  }

  hasOwnRoute(name:string):boolean {
    return this.recognizer.hasRoute(name);
  }

  handleUnknownRoutes(config?:string|Function|Object) {
    var callback = instruction => new Promise((resolve, reject) => {
      function done(inst){
        inst = inst || instruction;
        inst.config.route = inst.params.path;
        resolve(inst);
      }

      if (!config) {
        instruction.config.moduleId = instruction.fragment;
        done(instruction);
      } else if (typeof config == 'string') {
        instruction.config.moduleId = config;
        done(instruction);
      } else if (typeof config == 'function') {
        processPotential(config(instruction), done, reject);
      } else {
        instruction.config = config;
        done(instruction);
      }
    });

    this.catchAllHandler = callback;
  }

  updateTitle() {
    if (this.parent) {
      return this.parent.updateTitle();
    }

    this.currentInstruction.navigationContext.updateTitle();
  }

  reset() {
    this.fallbackOrder = 100;
    this.recognizer = new RouteRecognizer();
    this.childRecognizer = new RouteRecognizer();
    this.routes = [];
    this.isNavigating = false;
    this.navigation = [];
    this.isConfigured = false;
  }
}

function validateRouteConfig(config:Object) {
  if (typeof config !== 'object') {
    throw new Error('Invalid Route Config');
  }

  if (typeof config.route !== 'string') {
    throw new Error('Invalid Route Config: You must specify a route pattern.');
  }

  if (!('redirect' in config || config.moduleId || config.navigationStrategy || config.viewPorts)) {
    throw new Error('Invalid Route Config: You must specify a moduleId, redirect, navigationStrategy, or viewPorts.')
  }
}

function evaluateNavigationStrategy(instruction:NavigationInstruction, evaluator:Function, context:Object): Promise<NavigationInstruction> {
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

function createResult(ctx, next) {
  return {
    status: next.status,
    context: ctx,
    output: next.output,
    completed: next.status == pipelineStatus.completed
  };
}

export const pipelineStatus = {
  completed: 'completed',
  cancelled: 'cancelled',
  rejected: 'rejected',
  running: 'running'
};

export class Pipeline {
  constructor() {
    this.steps = [];
  }

  withStep(step) {
    var run, steps, i, l;

    if (typeof step == 'function') {
      run = step;
    } else if (step.isMultiStep) {
      steps = step.getSteps();
      for (i = 0, l = steps.length; i < l; i++) {
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
    var index = -1,
        steps = this.steps,
        next, currentStep;

    next = function() {
      index++;

      if (index < steps.length) {
        currentStep = steps[index];

        try {
          return currentStep(ctx, next);
        } catch(e) {
          return next.reject(e);
        }
      } else {
        return next.complete();
      }
    };

    next.complete = output => {
      next.status = pipelineStatus.completed;
      next.output = output;
      return Promise.resolve(createResult(ctx, next));
    };

    next.cancel = reason => {
      next.status = pipelineStatus.cancelled;
      next.output = reason;
      return Promise.resolve(createResult(ctx, next));
    };

    next.reject = error => {
      next.status = pipelineStatus.rejected;
      next.output = error;
      return Promise.resolve(createResult(ctx, next));
    };

    next.status = pipelineStatus.running;

    return next();
  }
}

export class RouteLoader {
  loadRoute(router, config){
    throw Error('Route loaders must implement "loadRoute(router, config)".');
  }
}

export class LoadRouteStep {
  static inject(){ return [RouteLoader]; }
  constructor(routeLoader){
    this.routeLoader = routeLoader;
  }

  run(navigationContext, next) {
    return loadNewRoute(this.routeLoader, navigationContext)
      .then(next)
      .catch(next.cancel);
  }
}

export function loadNewRoute(routeLoader, navigationContext) {
  var toLoad = determineWhatToLoad(navigationContext);
  var loadPromises = toLoad.map(current => loadRoute(
    routeLoader,
    current.navigationContext,
    current.viewPortPlan
    )
  );

  return Promise.all(loadPromises);
}

function determineWhatToLoad(navigationContext, toLoad) {
  var plan = navigationContext.plan;
  var next = navigationContext.nextInstruction;

  toLoad = toLoad || [];

  for (var viewPortName in plan) {
    var viewPortPlan = plan[viewPortName];

    if (viewPortPlan.strategy == activationStrategy.replace) {
      toLoad.push({
        viewPortPlan: viewPortPlan,
        navigationContext: navigationContext
      });

      if (viewPortPlan.childNavigationContext) {
        determineWhatToLoad(viewPortPlan.childNavigationContext, toLoad);
      }
    } else {
      var viewPortInstruction = next.addViewPortInstruction(
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

function loadRoute(routeLoader, navigationContext, viewPortPlan) {
  var moduleId = viewPortPlan.config.moduleId;
  var next = navigationContext.nextInstruction;

  return loadComponent(routeLoader, navigationContext, viewPortPlan.config).then(component => {
    var viewPortInstruction = next.addViewPortInstruction(
      viewPortPlan.name,
      viewPortPlan.strategy,
      moduleId,
      component
      );

    var controller = component.executionContext,
        childRouter = component.childRouter;

    if(childRouter) {
      var path = next.getWildcardPath();

      return childRouter.createNavigationInstruction(path, next)
        .then(childInstruction => {
          let childNavigationContext = childRouter.createNavigationContext(childInstruction);
          viewPortPlan.childNavigationContext = childNavigationContext;

          return buildNavigationPlan(childNavigationContext)
            .then(childPlan => {
              childNavigationContext.plan = childPlan;
              viewPortInstruction.childNavigationContext = childNavigationContext;

              return loadNewRoute(routeLoader, childNavigationContext);
            });
        });
    }
  });
}

function loadComponent(routeLoader, navigationContext, config){
  var router = navigationContext.router,
      lifecycleArgs = navigationContext.nextInstruction.lifecycleArgs;

  return routeLoader.loadRoute(router, config).then(component => {
    component.router = router;
    component.config = config;

    if('configureRouter' in component.executionContext){
      component.childRouter = component.childContainer.getChildRouter();

      var config = new RouterConfiguration();
      var result = Promise.resolve(component.executionContext.configureRouter(config, component.childRouter, ...lifecycleArgs));

      return result.then(() => {
        component.childRouter.configure(config);
        return component;
      });
    }

    return component;
  });
}

export class PipelineProvider {
  static inject(){ return [Container]; }
  constructor(container){
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

  createPipeline(navigationContext) {
    var pipeline = new Pipeline();
    this.steps.forEach(step => pipeline.withStep(this.container.get(step)));
    return pipeline;
  }
}

import * as LogManager from 'aurelia-logging';
const logger = LogManager.getLogger('app-router');

export class AppRouter extends Router {
  static inject(){ return [Container, History, PipelineProvider, EventAggregator]; }
  constructor(container, history, pipelineProvider, events) {
    super(container, history);
    this.pipelineProvider = pipelineProvider;
    document.addEventListener('click', handleLinkClick.bind(this), true);
    this.events = events;
    this.maxInstructionCount = 10;
  }

  get isRoot() {
    return true;
  }

  loadUrl(url) {
    return this.createNavigationInstruction(url)
      .then(instruction => this.queueInstruction(instruction))
      .catch(error => {
        logger.error(error);
        restorePreviousLocation(this);
      });
  }

  queueInstruction(instruction) {
    return new Promise(resolve => {
      instruction.resolve = resolve;
      this.queue.unshift(instruction);
      this.dequeueInstruction();
    });
  }

  dequeueInstruction(instructionCount = 0) {
    return Promise.resolve().then(() => {
      if (this.isNavigating && !instructionCount) {
        return;
      }

      let instruction = this.queue.shift();
      this.queue = [];

      if (!instruction) {
        return;
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

  registerViewPort(viewPort, name) {
    super.registerViewPort(viewPort, name);

    if (!this.isActive) {
      if('configureRouter' in this.container.viewModel){
        var config = new RouterConfiguration();
        var result = Promise.resolve(this.container.viewModel.configureRouter(config, this));

        return result.then(() => {
          this.configure(config);
          this.activate();
        });
      }else{
        this.activate();
      }
    } else {
      this.dequeueInstruction();
    }
  }

  activate(options) {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
    this.history.activate(this.options);
    this.dequeueInstruction();
  }

  deactivate() {
    this.isActive = false;
    this.history.deactivate();
  }

  reset() {
    super.reset();
    this.queue = [];
    this.options = null;
  }
}

function findAnchor(el) {
  while (el) {
    if (el.tagName === "A") return el;
    el = el.parentNode;
  }
}

function handleLinkClick(evt) {
  if (!this.isActive) {
    return;
  }

  var target = findAnchor(evt.target);
  if (!target) {
    return;
  }

  if (this.history._hasPushState) {
    if (!evt.altKey && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey && targetIsThisWindow(target)) {
      var href = target.getAttribute('href');

      // Ensure the protocol is not part of URL, meaning its relative.
      // Stop the event bubbling to ensure the link will not cause a page refresh.
      if (href !== null && !(href.charAt(0) === "#" || (/^[a-z]+:/i).test(href))) {
        evt.preventDefault();
        this.history.navigate(href);
      }
    }
  }
}

function targetIsThisWindow(target) {
  var targetWindow = target.getAttribute('target');

  return !targetWindow ||
    targetWindow === window.name ||
    targetWindow === '_self' ||
    (targetWindow === 'top' && window === window.top);
}

function processResult(instruction, result, instructionCount, router) {
  if (!(result && 'completed' in result && 'output' in result)) {
    resut = result || {};
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
