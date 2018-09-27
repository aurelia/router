import * as LogManager from 'aurelia-logging';
import { RouteRecognizer } from 'aurelia-route-recognizer';
import { Container } from 'aurelia-dependency-injection';
import { History, NavigationOptions } from 'aurelia-history';
import { EventAggregator } from 'aurelia-event-aggregator';

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

export let CommitChangesStep = class CommitChangesStep {
  run(navigationInstruction, next) {
    return navigationInstruction._commitChanges(true).then(() => {
      navigationInstruction._updateTitle();
      return next();
    });
  }
};

export let NavigationInstruction = class NavigationInstruction {

  constructor(init) {
    this.plan = null;
    this.options = {};

    Object.assign(this, init);

    this.params = this.params || {};
    this.viewPortInstructions = {};

    let ancestorParams = [];
    let current = this;
    do {
      let currentParams = Object.assign({}, current.params);
      if (current.config && current.config.hasChildRouter) {
        delete currentParams[current.getWildCardName()];
      }

      ancestorParams.unshift(currentParams);
      current = current.parentInstruction;
    } while (current);

    let allParams = Object.assign({}, this.queryParams, ...ancestorParams);
    this.lifecycleArgs = [allParams, this.config, this];
  }

  getAllInstructions() {
    let instructions = [this];
    for (let key in this.viewPortInstructions) {
      let childInstruction = this.viewPortInstructions[key].childNavigationInstruction;
      if (childInstruction) {
        instructions.push(...childInstruction.getAllInstructions());
      }
    }

    return instructions;
  }

  getAllPreviousInstructions() {
    return this.getAllInstructions().map(c => c.previousInstruction).filter(c => c);
  }

  addViewPortInstruction(viewPortName, strategy, moduleId, component) {
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

  getWildCardName() {
    let wildcardIndex = this.config.route.lastIndexOf('*');
    return this.config.route.substr(wildcardIndex + 1);
  }

  getWildcardPath() {
    let wildcardName = this.getWildCardName();
    let path = this.params[wildcardName] || '';

    if (this.queryString) {
      path += '?' + this.queryString;
    }

    return path;
  }

  getBaseUrl() {
    let fragment = decodeURI(this.fragment);

    if (fragment === '') {
      let nonEmptyRoute = this.router.routes.find(route => {
        return route.name === this.config.name && route.route !== '';
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

  _commitChanges(waitToSwap) {
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
            delaySwaps.push({ viewPort, viewPortInstruction });
          }
          loads.push(viewPort.process(viewPortInstruction, waitToSwap).then(x => {
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

  _updateTitle() {
    let title = this._buildTitle(this.router.titleSeparator);
    if (title) {
      this.router.history.setTitle(title);
    }
  }

  _buildTitle(separator = ' | ') {
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
};

function prune(instruction) {
  instruction.previousInstruction = null;
  instruction.plan = null;
}

export let NavModel = class NavModel {

  constructor(router, relativeHref) {
    this.isActive = false;
    this.title = null;
    this.href = null;
    this.relativeHref = null;
    this.settings = {};
    this.config = null;

    this.router = router;
    this.relativeHref = relativeHref;
  }

  setTitle(title) {
    this.title = title;

    if (this.isActive) {
      this.router.updateTitle();
    }
  }
};

export function isNavigationCommand(obj) {
  return obj && typeof obj.navigate === 'function';
}

export let Redirect = class Redirect {
  constructor(url, options = {}) {
    this.url = url;
    this.options = Object.assign({ trigger: true, replace: true }, options);
    this.shouldContinueProcessing = false;
  }

  setRouter(router) {
    this.router = router;
  }

  navigate(appRouter) {
    let navigatingRouter = this.options.useAppRouter ? appRouter : this.router || appRouter;
    navigatingRouter.navigate(this.url, this.options);
  }
};

export let RedirectToRoute = class RedirectToRoute {
  constructor(route, params = {}, options = {}) {
    this.route = route;
    this.params = params;
    this.options = Object.assign({ trigger: true, replace: true }, options);
    this.shouldContinueProcessing = false;
  }

  setRouter(router) {
    this.router = router;
  }

  navigate(appRouter) {
    let navigatingRouter = this.options.useAppRouter ? appRouter : this.router || appRouter;
    navigatingRouter.navigateToRoute(this.route, this.params, this.options);
  }
};

export const pipelineStatus = {
  completed: 'completed',
  canceled: 'canceled',
  rejected: 'rejected',
  running: 'running'
};

export let Pipeline = class Pipeline {
  constructor() {
    this.steps = [];
  }

  addStep(step) {
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

  run(instruction) {
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
};

function createCompletionHandler(next, status) {
  return output => {
    return Promise.resolve({ status, output, completed: status === pipelineStatus.completed });
  };
}

export let RouterConfiguration = class RouterConfiguration {
  constructor() {
    this.instructions = [];
    this.options = {};
    this.pipelineSteps = [];
  }

  addPipelineStep(name, step) {
    if (step === null || step === undefined) {
      throw new Error('Pipeline step cannot be null or undefined.');
    }
    this.pipelineSteps.push({ name, step });
    return this;
  }

  addAuthorizeStep(step) {
    return this.addPipelineStep('authorize', step);
  }

  addPreActivateStep(step) {
    return this.addPipelineStep('preActivate', step);
  }

  addPreRenderStep(step) {
    return this.addPipelineStep('preRender', step);
  }

  addPostRenderStep(step) {
    return this.addPipelineStep('postRender', step);
  }

  fallbackRoute(fragment) {
    this._fallbackRoute = fragment;
    return this;
  }

  map(route) {
    if (Array.isArray(route)) {
      route.forEach(this.map.bind(this));
      return this;
    }

    return this.mapRoute(route);
  }

  useViewPortDefaults(viewPortConfig) {
    this.viewPortDefaults = viewPortConfig;
    return this;
  }

  mapRoute(config) {
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
        let { name, step } = pipelineSteps[i];
        pipelineProvider.addStep(name, step);
      }
    }
  }
};

export const activationStrategy = {
  noChange: 'no-change',
  invokeLifecycle: 'invoke-lifecycle',
  replace: 'replace'
};

export let BuildNavigationPlanStep = class BuildNavigationPlanStep {
  run(navigationInstruction, next) {
    return _buildNavigationPlan(navigationInstruction).then(plan => {
      if (plan instanceof Redirect) {
        return next.cancel(plan);
      }
      navigationInstruction.plan = plan;
      return next();
    }).catch(next.cancel);
  }
};

export function _buildNavigationPlan(instruction, forceLifecycleMinimum) {
  let config = instruction.config;

  if ('redirect' in config) {
    let router = instruction.router;
    return router._createNavigationInstruction(config.redirect).then(newInstruction => {
      let params = {};
      for (let key in newInstruction.params) {
        let val = newInstruction.params[key];
        if (typeof val === 'string' && val[0] === ':') {
          val = val.slice(1);

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
        viewPortPlan.strategy = prevViewPortInstruction.component.viewModel.determineActivationStrategy(...instruction.lifecycleArgs);
      } else if (config.activationStrategy) {
        viewPortPlan.strategy = config.activationStrategy;
      } else if (newParams || forceLifecycleMinimum) {
        viewPortPlan.strategy = activationStrategy.invokeLifecycle;
      } else {
        viewPortPlan.strategy = activationStrategy.noChange;
      }

      if (viewPortPlan.strategy !== activationStrategy.replace && prevViewPortInstruction.childRouter) {
        let path = instruction.getWildcardPath();
        let task = prevViewPortInstruction.childRouter._createNavigationInstruction(path, instruction).then(childInstruction => {
          viewPortPlan.childNavigationInstruction = childInstruction;

          return _buildNavigationPlan(childInstruction, viewPortPlan.strategy === activationStrategy.invokeLifecycle).then(childPlan => {
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

function hasDifferentParameterValues(prev, next) {
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

export let Router = class Router {
  constructor(container, history) {
    this.parent = null;
    this.options = {};
    this.viewPortDefaults = {};

    this.transformTitle = title => {
      if (this.parent) {
        return this.parent.transformTitle(title);
      }
      return title;
    };

    this.container = container;
    this.history = history;
    this.reset();
  }

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

  get isRoot() {
    return !this.parent;
  }

  registerViewPort(viewPort, name) {
    name = name || 'default';
    this.viewPorts[name] = viewPort;
  }

  ensureConfigured() {
    return this._configuredPromise;
  }

  configure(callbackOrConfig) {
    this.isConfigured = true;

    let result = callbackOrConfig;
    let config;
    if (typeof callbackOrConfig === 'function') {
      config = new RouterConfiguration();
      result = callbackOrConfig(config);
    }

    return Promise.resolve(result).then(c => {
      if (c && c.exportToRouter) {
        config = c;
      }

      config.exportToRouter(this);
      this.isConfigured = true;
      this._resolveConfiguredPromise();
    });
  }

  navigate(fragment, options) {
    if (!this.isConfigured && this.parent) {
      return this.parent.navigate(fragment, options);
    }

    this.isExplicitNavigation = true;
    return this.history.navigate(_resolveUrl(fragment, this.baseUrl, this.history._hasPushState), options);
  }

  navigateToRoute(route, params, options) {
    let path = this.generate(route, params);
    return this.navigate(path, options);
  }

  navigateBack() {
    this.isExplicitNavigationBack = true;
    this.history.navigateBack();
  }

  createChild(container) {
    let childRouter = new Router(container || this.container.createChild(), this.history);
    childRouter.parent = this;
    return childRouter;
  }

  generate(name, params, options = {}) {
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

  createNavModel(config) {
    let navModel = new NavModel(this, 'href' in config ? config.href : config.route);
    navModel.title = config.title;
    navModel.order = config.nav;
    navModel.href = config.href;
    navModel.settings = config.settings;
    navModel.config = config;

    return navModel;
  }

  addRoute(config, navModel) {
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
    let state = this._recognizer.add({ path: path, handler: config, caseSensitive: caseSensitive });

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
      if (!navModel.href && navModel.href !== '' && (state.types.dynamics || state.types.stars)) {
        throw new Error('Invalid route config for "' + config.route + '" : dynamic routes must specify an "href:" to be included in the navigation model.');
      }

      if (typeof navModel.order !== 'number') {
        navModel.order = ++this._fallbackOrder;
      }

      this.navigation.push(navModel);
      this.navigation = this.navigation.sort((a, b) => a.order - b.order);
    }
  }

  hasRoute(name) {
    return !!(this._recognizer.hasRoute(name) || this.parent && this.parent.hasRoute(name));
  }

  hasOwnRoute(name) {
    return this._recognizer.hasRoute(name);
  }

  handleUnknownRoutes(config) {
    if (!config) {
      throw new Error('Invalid unknown route handler');
    }

    this.catchAllHandler = instruction => {
      return this._createRouteConfig(config, instruction).then(c => {
        instruction.config = c;
        return instruction;
      });
    };
  }

  updateTitle() {
    if (this.parent) {
      return this.parent.updateTitle();
    }

    if (this.currentInstruction) {
      this.currentInstruction._updateTitle();
    }
    return undefined;
  }

  refreshNavigation() {
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

  useViewPortDefaults(viewPortDefaults) {
    for (let viewPortName in viewPortDefaults) {
      let viewPortConfig = viewPortDefaults[viewPortName];
      this.viewPortDefaults[viewPortName] = {
        moduleId: viewPortConfig.moduleId
      };
    }
  }

  _refreshBaseUrl() {
    if (this.parent) {
      this.baseUrl = generateBaseUrl(this.parent, this.parent.currentInstruction);
    }
  }

  _createNavigationInstruction(url = '', parentInstruction = null) {
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
        config: null }));

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
          config: null }));

        result = evaluateNavigationStrategy(instruction, router.catchAllHandler);
      }
    }

    if (result && parentInstruction) {
      this.baseUrl = generateBaseUrl(this.parent, parentInstruction);
    }

    return result || Promise.reject(new Error(`Route not found: ${url}`));
  }

  _findParentInstructionFromRouter(router, instruction) {
    if (instruction.router === router) {
      instruction.fragment = router.baseUrl;
      return instruction;
    } else if (instruction.parentInstruction) {
      return this._findParentInstructionFromRouter(router, instruction.parentInstruction);
    }
    return undefined;
  }

  _parentCatchAllHandler(router) {
    if (router.catchAllHandler) {
      return router;
    } else if (router.parent) {
      return this._parentCatchAllHandler(router.parent);
    }
    return false;
  }

  _createRouteConfig(config, instruction) {
    return Promise.resolve(config).then(c => {
      if (typeof c === 'string') {
        return { moduleId: c };
      } else if (typeof c === 'function') {
        return c(instruction);
      }

      return c;
    }).then(c => typeof c === 'string' ? { moduleId: c } : c).then(c => {
      c.route = instruction.params.path;
      validateRouteConfig(c, this.routes);

      if (!c.navModel) {
        c.navModel = this.createNavModel(c);
      }

      return c;
    });
  }
};

function generateBaseUrl(router, instruction) {
  return `${router.baseUrl || ''}${instruction.getBaseUrl() || ''}`;
}

function validateRouteConfig(config, routes) {
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

function evaluateNavigationStrategy(instruction, evaluator, context) {
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

export let CanDeactivatePreviousStep = class CanDeactivatePreviousStep {
  run(navigationInstruction, next) {
    return processDeactivatable(navigationInstruction, 'canDeactivate', next);
  }
};

export let CanActivateNextStep = class CanActivateNextStep {
  run(navigationInstruction, next) {
    return processActivatable(navigationInstruction, 'canActivate', next);
  }
};

export let DeactivatePreviousStep = class DeactivatePreviousStep {
  run(navigationInstruction, next) {
    return processDeactivatable(navigationInstruction, 'deactivate', next, true);
  }
};

export let ActivateNextStep = class ActivateNextStep {
  run(navigationInstruction, next) {
    return processActivatable(navigationInstruction, 'activate', next, true);
  }
};

function processDeactivatable(navigationInstruction, callbackName, next, ignoreResult) {
  const plan = navigationInstruction.plan;
  let infos = findDeactivatable(plan, callbackName);
  let i = infos.length;

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

function findDeactivatable(plan, callbackName, list = []) {
  for (let viewPortName in plan) {
    let viewPortPlan = plan[viewPortName];
    let prevComponent = viewPortPlan.prevComponent;

    if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle || viewPortPlan.strategy === activationStrategy.replace) && prevComponent) {
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

function addPreviousDeactivatable(component, callbackName, list) {
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

function processActivatable(navigationInstruction, callbackName, next, ignoreResult) {
  let infos = findActivatable(navigationInstruction, callbackName);
  let length = infos.length;
  let i = -1;

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

function findActivatable(navigationInstruction, callbackName, list = [], router) {
  let plan = navigationInstruction.plan;

  Object.keys(plan).filter(viewPortName => {
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
      findActivatable(viewPortPlan.childNavigationInstruction, callbackName, list, viewPortInstruction.component.childRouter || router);
    }
  });

  return list;
}

function shouldContinue(output, router) {
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

let SafeSubscription = class SafeSubscription {
  constructor(subscriptionFunc) {
    this._subscribed = true;
    this._subscription = subscriptionFunc(this);

    if (!this._subscribed) this.unsubscribe();
  }

  get subscribed() {
    return this._subscribed;
  }

  unsubscribe() {
    if (this._subscribed && this._subscription) this._subscription.unsubscribe();

    this._subscribed = false;
  }
};


function processPotential(obj, resolve, reject) {
  if (obj && typeof obj.then === 'function') {
    return Promise.resolve(obj).then(resolve).catch(reject);
  }

  if (obj && typeof obj.subscribe === 'function') {
    let obs = obj;
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

export let RouteLoader = class RouteLoader {
  loadRoute(router, config, navigationInstruction) {
    throw Error('Route loaders must implement "loadRoute(router, config, navigationInstruction)".');
  }
};

export let LoadRouteStep = class LoadRouteStep {
  static inject() {
    return [RouteLoader];
  }

  constructor(routeLoader) {
    this.routeLoader = routeLoader;
  }

  run(navigationInstruction, next) {
    return loadNewRoute(this.routeLoader, navigationInstruction).then(next).catch(next.cancel);
  }
};

function loadNewRoute(routeLoader, navigationInstruction) {
  let toLoad = determineWhatToLoad(navigationInstruction);
  let loadPromises = toLoad.map(current => loadRoute(routeLoader, current.navigationInstruction, current.viewPortPlan));

  return Promise.all(loadPromises);
}

function determineWhatToLoad(navigationInstruction, toLoad = []) {
  let plan = navigationInstruction.plan;

  for (let viewPortName in plan) {
    let viewPortPlan = plan[viewPortName];

    if (viewPortPlan.strategy === activationStrategy.replace) {
      toLoad.push({ viewPortPlan, navigationInstruction });

      if (viewPortPlan.childNavigationInstruction) {
        determineWhatToLoad(viewPortPlan.childNavigationInstruction, toLoad);
      }
    } else {
      let viewPortInstruction = navigationInstruction.addViewPortInstruction(viewPortName, viewPortPlan.strategy, viewPortPlan.prevModuleId, viewPortPlan.prevComponent);

      if (viewPortPlan.childNavigationInstruction) {
        viewPortInstruction.childNavigationInstruction = viewPortPlan.childNavigationInstruction;
        determineWhatToLoad(viewPortPlan.childNavigationInstruction, toLoad);
      }
    }
  }

  return toLoad;
}

function loadRoute(routeLoader, navigationInstruction, viewPortPlan) {
  let moduleId = viewPortPlan.config ? viewPortPlan.config.moduleId : null;

  return loadComponent(routeLoader, navigationInstruction, viewPortPlan.config).then(component => {
    let viewPortInstruction = navigationInstruction.addViewPortInstruction(viewPortPlan.name, viewPortPlan.strategy, moduleId, component);

    let childRouter = component.childRouter;
    if (childRouter) {
      let path = navigationInstruction.getWildcardPath();

      return childRouter._createNavigationInstruction(path, navigationInstruction).then(childInstruction => {
        viewPortPlan.childNavigationInstruction = childInstruction;

        return _buildNavigationPlan(childInstruction).then(childPlan => {
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

function loadComponent(routeLoader, navigationInstruction, config) {
  let router = navigationInstruction.router;
  let lifecycleArgs = navigationInstruction.lifecycleArgs;

  return routeLoader.loadRoute(router, config, navigationInstruction).then(component => {
    let { viewModel, childContainer } = component;
    component.router = router;
    component.config = config;

    if ('configureRouter' in viewModel) {
      let childRouter = childContainer.getChildRouter();
      component.childRouter = childRouter;

      return childRouter.configure(c => viewModel.configureRouter(c, childRouter, ...lifecycleArgs)).then(() => component);
    }

    return component;
  });
}

let PipelineSlot = class PipelineSlot {

  constructor(container, name, alias) {
    this.steps = [];

    this.container = container;
    this.slotName = name;
    this.slotAlias = alias;
  }

  getSteps() {
    return this.steps.map(x => this.container.get(x));
  }
};

export let PipelineProvider = class PipelineProvider {
  static inject() {
    return [Container];
  }

  constructor(container) {
    this.container = container;
    this.steps = [BuildNavigationPlanStep, CanDeactivatePreviousStep, LoadRouteStep, this._createPipelineSlot('authorize'), CanActivateNextStep, this._createPipelineSlot('preActivate', 'modelbind'), DeactivatePreviousStep, ActivateNextStep, this._createPipelineSlot('preRender', 'precommit'), CommitChangesStep, this._createPipelineSlot('postRender', 'postcomplete')];
  }

  createPipeline(useCanDeactivateStep = true) {
    let pipeline = new Pipeline();
    this.steps.forEach(step => {
      if (useCanDeactivateStep || step !== CanDeactivatePreviousStep) {
        pipeline.addStep(this.container.get(step));
      }
    });
    return pipeline;
  }

  _findStep(name) {
    return this.steps.find(x => x.slotName === name || x.slotAlias === name);
  }

  addStep(name, step) {
    let found = this._findStep(name);
    if (found) {
      if (!found.steps.includes(step)) {
        found.steps.push(step);
      }
    } else {
      throw new Error(`Invalid pipeline slot name: ${name}.`);
    }
  }

  removeStep(name, step) {
    let slot = this._findStep(name);
    if (slot) {
      slot.steps.splice(slot.steps.indexOf(step), 1);
    }
  }

  _clearSteps(name = '') {
    let slot = this._findStep(name);
    if (slot) {
      slot.steps = [];
    }
  }

  reset() {
    this._clearSteps('authorize');
    this._clearSteps('preActivate');
    this._clearSteps('preRender');
    this._clearSteps('postRender');
  }

  _createPipelineSlot(name, alias) {
    return new PipelineSlot(this.container, name, alias);
  }
};

const logger = LogManager.getLogger('app-router');

export let AppRouter = class AppRouter extends Router {
  static inject() {
    return [Container, History, PipelineProvider, EventAggregator];
  }

  constructor(container, history, pipelineProvider, events) {
    super(container, history);
    this.pipelineProvider = pipelineProvider;
    this.events = events;
  }

  reset() {
    super.reset();
    this.maxInstructionCount = 10;
    if (!this._queue) {
      this._queue = [];
    } else {
      this._queue.length = 0;
    }
  }

  loadUrl(url) {
    return this._createNavigationInstruction(url).then(instruction => this._queueInstruction(instruction)).catch(error => {
      logger.error(error);
      restorePreviousLocation(this);
    });
  }

  registerViewPort(viewPort, name) {
    super.registerViewPort(viewPort, name);

    if (!this.isActive) {
      let viewModel = this._findViewModel(viewPort);
      if ('configureRouter' in viewModel) {
        if (!this.isConfigured) {
          let resolveConfiguredPromise = this._resolveConfiguredPromise;
          this._resolveConfiguredPromise = () => {};
          return this.configure(config => viewModel.configureRouter(config, this)).then(() => {
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

  activate(options) {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
    this.history.activate(this.options);
    this._dequeueInstruction();
  }

  deactivate() {
    this.isActive = false;
    this.history.deactivate();
  }

  _queueInstruction(instruction) {
    return new Promise(resolve => {
      instruction.resolve = resolve;
      this._queue.unshift(instruction);
      this._dequeueInstruction();
    });
  }

  _dequeueInstruction(instructionCount = 0) {
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

      let navtracker = this.history.getState('NavigationTracker');
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
      }if (!navtracker) {
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

      return pipeline.run(instruction).then(result => processResult(instruction, result, instructionCount, this)).catch(error => {
        return { output: error instanceof Error ? error : new Error(error) };
      }).then(result => resolveInstruction(instruction, result, !!instructionCount, this));
    });
  }

  _findViewModel(viewPort) {
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
};

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

  return Promise.resolve(navigationCommandResult).then(_ => router._dequeueInstruction(instructionCount + 1)).then(innerResult => finalResult || innerResult || result);
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
      let queryString = instruction.queryString ? '?' + instruction.queryString : '';
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