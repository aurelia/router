import 'core-js';
import {RouteRecognizer} from 'aurelia-route-recognizer';
import {Container} from 'aurelia-dependency-injection';
import {History} from 'aurelia-history';
import {NavigationContext} from './navigation-context';
import {NavigationInstruction} from './navigation-instruction';
import {NavModel} from './nav-model';
import {RouterConfiguration} from './router-configuration';
import {
  _createRootedPath,
  _resolveUrl} from './util';
import {RouteConfig} from './interfaces';

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
  * The parent router, or null if this instance is not a child router.
  */
  parent: Router;

  _fallbackOrder: number = 100;
  _recognizer: RouteRecognizer = new RouteRecognizer();
  _childRecognizer: RouteRecognizer = new RouteRecognizer();

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
    return !this.parent;
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
  navigate(fragment: string, options?: Object): boolean {
    if (!this.isConfigured && this.parent) {
      return this.parent.navigate(fragment, options);
    }

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
  navigateToRoute(route: string, params?: Object, options?: Object): boolean {
    let path = this.generate(route, params);
    return this.navigate(path, options);
  }

  /**
  * Navigates back to the most recent location in history.
  */
  navigateBack(): void {
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
    let hasRoute = this._recognizer.hasRoute(name);
    if ((!this.isConfigured || !hasRoute) && this.parent) {
      return this.parent.generate(name, params);
    }

    if (!hasRoute) {
      throw new Error(`A route with name '${name}' could not be found. Check that \`name: '${name}'\` was specified in the route's config.`);
    }

    let path = this._recognizer.generate(name, params);
    return _createRootedPath(path, this.baseUrl, this.history._hasPushState);
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

    let state = this._recognizer.add({path: path, handler: config});

    if (path) {
      let settings = config.settings;
      delete config.settings;
      let withChild = JSON.parse(JSON.stringify(config));
      config.settings = settings;
      withChild.route = `${path}/*childRoute`;
      withChild.hasChildRouter = true;
      this._childRecognizer.add({
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

    this.currentInstruction.navigationContext.updateTitle();
  }

  /**
  * Resets the Router to its original unconfigured state.
  */
  reset(): void {
    this._fallbackOrder = 100;
    this._recognizer = new RouteRecognizer();
    this._childRecognizer = new RouteRecognizer();
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

  _refreshBaseUrl(): void {
    if (this.parent) {
      let baseUrl = this.parent.currentInstruction.getBaseUrl();
      this.baseUrl = this.parent.baseUrl + baseUrl;
    }
  }

  _refreshNavigation(): void {
    let nav = this.navigation;

    for (let i = 0, length = nav.length; i < length; i++) {
      let current = nav[i];
      if (!current.href) {
        current.href = _createRootedPath(current.relativeHref, this.baseUrl, this.history._hasPushState);
      }
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

    if ((!results || !results.length) && this.catchAllHandler) {
      let params = { path: fragment };
      let instruction = new NavigationInstruction(
        fragment,
        queryString,
        params,
        results && results.queryParams,
        null, // config will be created by the catchAllHandler
        parentInstruction);

      return evaluateNavigationStrategy(instruction, this.catchAllHandler);
    }

    if (results && results.length) {
      let first = results[0];
      let instruction = new NavigationInstruction(
        fragment,
        queryString,
        first.params,
        first.queryParams || results.queryParams,
        first.config || first.handler,
        parentInstruction);

      if (typeof first.handler === 'function') {
        return evaluateNavigationStrategy(instruction, first.handler, first);
      } else if (first.handler && 'navigationStrategy' in first.handler) {
        return evaluateNavigationStrategy(instruction, first.handler.navigationStrategy, first.handler);
      }

      return Promise.resolve(instruction);
    }

    return Promise.reject(new Error(`Route not found: ${url}`));
  }

  _createNavigationContext(instruction: NavigationInstruction): NavigationContext {
    instruction.navigationContext = new NavigationContext(this, instruction);
    return instruction.navigationContext;
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
        validateRouteConfig(c);

        if (!c.navModel) {
          c.navModel = this.createNavModel(c);
        }

        return c;
      });
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
