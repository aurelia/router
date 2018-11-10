import { RouteRecognizer, RouteHandler, ConfigurableRoute, State, RecognizedRoute } from 'aurelia-route-recognizer';
import { Container } from 'aurelia-dependency-injection';
import { History, NavigationOptions } from 'aurelia-history';
import { NavigationInstruction, NavigationInstructionInit } from './navigation-instruction';
import { NavModel } from './nav-model';
import { RouterConfiguration } from './router-configuration';
import {
  _ensureArrayWithSingleRoutePerConfig,
  _normalizeAbsolutePath,
  _createRootedPath,
  _resolveUrl
} from './util';
import { RouteConfig, NavigationResult, RouteConfigSpecifier, ViewPort, ViewPortInstruction } from './interfaces';
import { PipelineProvider } from './pipeline-provider';

/**@internal */
declare module 'aurelia-history' {
  interface History {
    // This is wrong, as it's an implementation detail from aurelia-history-browser
    // but we are poking it in here so probably will need to make it official in `aurelia-history`
    /**
     * A private flag of Aurelia History implementation to indicate if push state should be used
     */
    _hasPushState: boolean;

    previousLocation: string;
  }
}

/**@internal */
declare module 'aurelia-route-recognizer' {
  interface State {
    types: {
      dynamics: DynamicSegment;
      stars: StarSegment;
    };
  }

  interface RouteHandler {
    navigationStrategy?: (instruction: NavigationInstruction) => any;
  }

  interface RecognizedRoute {
    config?: RouteConfig;
    queryParams?: Record<string, any>;
  }
}

type RouterConfigurationResolution = RouterConfiguration | ((cfg: RouterConfiguration) => void | RouterConfiguration | Promise<RouterConfiguration>);

/**
* The primary class responsible for handling routing and navigation.
*
* @class Router
* @constructor
*/
export class Router {
  container: Container;
  history: History;

  viewPorts: Record<string, ViewPort>;

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
  viewPortDefaults: Record<string, Partial<ViewPortInstruction>> = {};

  /**@internal */
  catchAllHandler: (instruction: NavigationInstruction) => NavigationInstruction | Promise<NavigationInstruction>;
  /**@internal */
  fallbackRoute: string;
  /**@internal */
  pipelineProvider: PipelineProvider;
  /**@internal */
  _fallbackOrder: number;
  /**@internal */
  _recognizer: RouteRecognizer;
  /**@internal */
  _childRecognizer: RouteRecognizer;
  /**@internal */
  _configuredPromise: Promise<any>;
  /**@internal */
  _resolveConfiguredPromise: (value?: any) => void;

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
  }

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
  configure(callbackOrConfig: RouterConfiguration | ((config: RouterConfiguration) => RouterConfiguration)): Promise<void> {
    this.isConfigured = true;

    let result: RouterConfigurationResolution = callbackOrConfig as RouterConfiguration;
    let config: RouterConfiguration;
    if (typeof callbackOrConfig === 'function') {
      config = new RouterConfiguration();
      result = callbackOrConfig(config);
    }

    return Promise
      .resolve(result)
      .then((c) => {
        if (c && (c as RouterConfiguration).exportToRouter) {
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
  navigate(fragment: string, options?: NavigationOptions): NavigationResult {
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
  navigateToRoute(route: string, params?: any, options?: NavigationOptions): NavigationResult {
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
  generate(name: string, params: any = {}, options: any = {}): string {
    let hasRoute = this._recognizer.hasRoute(name);
    if (!hasRoute) {
      if (this.parent) {
        return this.parent.generate(name, params, options);
      }
      throw new Error(`A route with name '${name}' could not be found. Check that \`name: '${name}'\` was specified in the route's config.`);
    }
    let recognizer = 'childRoute' in params ? this._childRecognizer : this._recognizer;
    let path = recognizer.generate(name, params);
    let rootedPath = _createRootedPath(path, this.baseUrl, this.history._hasPushState, options.absolute);
    return options.absolute ? `${this.history.getAbsoluteRoot()}${rootedPath}` : rootedPath;
  }

  /**
  * Creates a [[NavModel]] for the specified route config.
  *
  * @param config The route config.
  */
  createNavModel(config: RouteConfig): NavModel {
    let navModel = new NavModel(
      this,
      'href' in config
        ? config.href
        // potential error when config.route is a string[] ?
        : config.route as string);
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
    let state: State = this._recognizer.add({
      path: path,
      handler: config as RouteHandler,
      caseSensitive: caseSensitive
    } as ConfigurableRoute);

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
      // this is a potential error / inconsistency between browsers
      this.navigation = this.navigation.sort((a, b) => <any>a.order - <any>b.order);
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
  handleUnknownRoutes(config?: string | Function | RouteConfig): void {
    if (!config) {
      throw new Error('Invalid unknown route handler');
    }

    this.catchAllHandler = instruction => {
      return this
        ._createRouteConfig(config as RouteConfigSpecifier, instruction)
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
  useViewPortDefaults(viewPortDefaults: Record<string, Partial<ViewPortInstruction>>) {
    for (let viewPortName in viewPortDefaults) {
      let viewPortConfig = viewPortDefaults[viewPortName];
      this.viewPortDefaults[viewPortName] = {
        moduleId: viewPortConfig.moduleId
      };
    }
  }

  /**@internal */
  _refreshBaseUrl(): void {
    if (this.parent) {
      this.baseUrl = generateBaseUrl(this.parent, this.parent.currentInstruction);
    }
  }

  /**@internal */
  _createNavigationInstruction(url: string = '', parentInstruction: NavigationInstruction = null): Promise<NavigationInstruction> {
    let fragment = url;
    let queryString = '';

    let queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      fragment = url.substr(0, queryIndex);
      queryString = url.substr(queryIndex + 1);
    }

    let urlRecognizationResults = this._recognizer.recognize(url) as IRouteRecognizationResults;
    if (!urlRecognizationResults || !urlRecognizationResults.length) {
      urlRecognizationResults = this._childRecognizer.recognize(url) as IRouteRecognizationResults;
    }

    let instructionInit: NavigationInstructionInit = {
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

    let result: Promise<NavigationInstruction>;

    if (urlRecognizationResults && urlRecognizationResults.length) {
      let first = urlRecognizationResults[0];
      let instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
        params: first.params,
        queryParams: first.queryParams || urlRecognizationResults.queryParams,
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
        queryParams: urlRecognizationResults ? urlRecognizationResults.queryParams : {},
        config: null // config will be created by the catchAllHandler
      }));

      result = evaluateNavigationStrategy(instruction, this.catchAllHandler);
    } else if (this.parent) {
      let router = this._parentCatchAllHandler(this.parent);

      if (router) {
        let newParentInstruction = this._findParentInstructionFromRouter(router, parentInstruction);

        let instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
          params: { path: fragment },
          queryParams: urlRecognizationResults ? urlRecognizationResults.queryParams : {},
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

  /**@internal */
  _findParentInstructionFromRouter(router: Router, instruction: NavigationInstruction): NavigationInstruction {
    if (instruction.router === router) {
      instruction.fragment = router.baseUrl; // need to change the fragment in case of a redirect instead of moduleId
      return instruction;
    } else if (instruction.parentInstruction) {
      return this._findParentInstructionFromRouter(router, instruction.parentInstruction);
    }
    return undefined;
  }

  /**@internal */
  _parentCatchAllHandler(router: Router): Router | false {
    if (router.catchAllHandler) {
      return router;
    } else if (router.parent) {
      return this._parentCatchAllHandler(router.parent);
    }
    return false;
  }

  /**
   * @internal
   */
  _createRouteConfig(
    config: RouteConfigSpecifier,
    instruction: NavigationInstruction
  ) {
    return Promise.resolve(config)
      .then(c => {
        if (typeof c === 'string') {
          return { moduleId: c } as RouteConfig;
        } else if (typeof c === 'function') {
          return c(instruction);
        }

        return c;
      })
      .then(c => typeof c === 'string' ? { moduleId: c } as RouteConfig : c)
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

function evaluateNavigationStrategy(
  instruction: NavigationInstruction,
  evaluator: Function,
  context?: any
): Promise<NavigationInstruction> {
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

interface IRouteRecognizationResults extends Array<RecognizedRoute> {
  queryParams: Record<string, any>;
}
