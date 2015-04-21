import core from 'core-js';
import {RouteRecognizer} from 'aurelia-route-recognizer';
import {join} from 'aurelia-path';
import {NavigationContext} from './navigation-context';
import {NavigationInstruction} from './navigation-instruction';
import {RouterConfiguration} from './router-configuration';
import {processPotential} from './util';

const isRooted = /^#?\//;

export class Router {
  constructor(container, history) {
    this.container = container;
    this.history = history;
    this.viewPorts = {};
    this.reset();
    this.baseUrl = '';
    this.isConfigured = false;
  }

  get isRoot() {
    return false;
  }

  registerViewPort(viewPort, name) {
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
      current.href = this.createRootedPath(current.relativeHref);
    }
  }

  configure(callbackOrConfig) {
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

  createRootedPath(fragment) {
    let path = '';

    if (this.baseUrl.length && this.baseUrl[0] !== '/') {
      path += '/';
    }

    path += this.baseUrl;

    if (path[path.length - 1] != '/' && fragment[0] != '/') {
      path += '/';
    }

    return normalizeAbsolutePath(path + fragment, this.history._hasPushState);
  }

  navigate(fragment, options) {
    if (!this.isConfigured && this.parent) {
      return this.parent.navigate(fragment, options);
    }

    if (fragment === '') {
      fragment = '/';
    }

    if (isRooted.test(fragment)) {
      fragment = normalizeAbsolutePath(fragment, this.history._hasPushState);
    } else {
      fragment = this.createRootedPath(fragment);
    }

    return this.history.navigate(fragment, options);
  }

  navigateToRoute(route, params, options) {
    let path = this.generate(route, params);
    return this.navigate(path, options);
  }

  navigateBack() {
    this.history.navigateBack();
  }

  createChild(container) {
    var childRouter = new Router(container || this.container.createChild(), this.history);
    childRouter.parent = this;
    return childRouter;
  }

  createNavigationInstruction(url = '', parentInstruction = null) {
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
      } else if(first.config && 'navigationStrategy' in first.config){
        return evaluateNavigationStrategy(instruction, first.config.navigationStrategy, first.config);
      }

      return Promise.resolve(instruction);
    }

    return Promise.reject(new Error(`Route not found: ${url}`));
  }

  createNavigationContext(instruction) {
    return new NavigationContext(this, instruction);
  }

  generate(name, params) {
    if((!this.isConfigured || !this.recognizer.hasRoute(name)) && this.parent){
      return this.parent.generate(name, params);
    }

    let path = this.recognizer.generate(name, params);
    return this.createRootedPath(path);
  }

  addRoute(config, navModel={}) {
    validateRouteConfig(config);

    if (!('viewPorts' in config)) {
      config.viewPorts = {
        'default': {
          moduleId: config.moduleId,
          moduleStrategy: config.moduleStrategy,
          view: config.view
        }
      };
    }

    navModel.title = navModel.title || config.title;
    navModel.settings = config.settings || (config.settings = {});

    this.routes.push(config);
    var state = this.recognizer.add({path:config.route, handler: config});

    if (config.route) {
      var withChild, settings = config.settings;
      delete config.settings;
      withChild = JSON.parse(JSON.stringify(config));
      config.settings = settings;
      withChild.route += '/*childRoute';
      withChild.hasChildRouter = true;
      this.childRecognizer.add({
        path: withChild.route,
        handler: withChild
      });

      withChild.navModel = navModel;
      withChild.settings = config.settings;
    }

    config.navModel = navModel;

    if ((config.nav || 'order' in navModel) && this.navigation.indexOf(navModel) === -1) {
      navModel.order = navModel.order || config.nav;
      navModel.href = navModel.href || config.href;
      navModel.isActive = false;
      navModel.config = config;

      if (!config.href) {
        if (state.types.dynamics || state.types.stars) {
          throw new Error('Invalid route config: dynamic routes must specify an href to be included in the navigation model.');
        }

        navModel.relativeHref = config.route;
        navModel.href = '';
      }

      if (typeof navModel.order != 'number') {
        navModel.order = ++this.fallbackOrder;
      }

      this.navigation.push(navModel);
      this.navigation = this.navigation.sort((a, b) => a.order - b.order);
    }
  }

  hasRoute(name) {
    return !!(this.recognizer.hasRoute(name) || this.parent && this.parent.hasRoute(name));
  }

  hasOwnRoute(name) {
    return this.recognizer.hasRoute(name);
  }

  handleUnknownRoutes(config) {
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

function validateRouteConfig(config) {
  let isValid = typeof config === 'object'
    && (config.moduleId || config.redirect)
    && config.route !== null && config.route !== undefined;

  if (!isValid) {
    throw new Error('Invalid Route Config: You must have at least a route and a moduleId or redirect.');
  }
}

function normalizeAbsolutePath(path, hasPushState) {
    if (!hasPushState && path[0] !== '#') {
      path = '#' + path;
    }

    return path;
}

function evaluateNavigationStrategy(instruction, evaluator, context){
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
