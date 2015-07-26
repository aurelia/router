import core from 'core-js';
import {RouteRecognizer} from 'aurelia-route-recognizer';
import {join} from 'aurelia-path';
import {Container} from 'aurelia-dependency-injection';
import {NavigationContext} from './navigation-context';
import {NavigationInstruction} from './navigation-instruction';
import {NavModel} from './nav-model';
import {RouterConfiguration} from './router-configuration';
import {
  processPotential,
  normalizeAbsolutePath,
  createRootedPath,
  resolveUrl} from './util';

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
