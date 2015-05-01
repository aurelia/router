define(['exports', 'core-js', 'aurelia-route-recognizer', 'aurelia-path', './navigation-context', './navigation-instruction', './router-configuration', './util'], function (exports, _coreJs, _aureliaRouteRecognizer, _aureliaPath, _navigationContext, _navigationInstruction, _routerConfiguration, _util) {
  'use strict';

  var _interopRequire = function (obj) { return obj && obj.__esModule ? obj['default'] : obj; };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  exports.__esModule = true;

  var _core = _interopRequire(_coreJs);

  var isRooted = /^#?\//;

  var Router = (function () {
    function Router(container, history) {
      _classCallCheck(this, Router);

      this.container = container;
      this.history = history;
      this.viewPorts = {};
      this.reset();
      this.baseUrl = '';
      this.isConfigured = false;
    }

    Router.prototype.registerViewPort = function registerViewPort(viewPort, name) {
      name = name || 'default';
      this.viewPorts[name] = viewPort;
    };

    Router.prototype.refreshBaseUrl = function refreshBaseUrl() {
      if (this.parent) {
        var baseUrl = this.parent.currentInstruction.getBaseUrl();
        this.baseUrl = this.parent.baseUrl + baseUrl;
      }
    };

    Router.prototype.refreshNavigation = function refreshNavigation() {
      var nav = this.navigation;

      for (var i = 0, length = nav.length; i < length; i++) {
        var current = nav[i];
        current.href = this.createRootedPath(current.relativeHref);
      }
    };

    Router.prototype.configure = function configure(callbackOrConfig) {
      this.isConfigured = true;

      if (typeof callbackOrConfig == 'function') {
        var config = new _routerConfiguration.RouterConfiguration();
        callbackOrConfig(config);
        config.exportToRouter(this);
      } else {
        callbackOrConfig.exportToRouter(this);
      }

      return this;
    };

    Router.prototype.createRootedPath = function createRootedPath(fragment) {
      var path = '';

      if (this.baseUrl.length && this.baseUrl[0] !== '/') {
        path += '/';
      }

      path += this.baseUrl;

      if (path[path.length - 1] != '/' && fragment[0] != '/') {
        path += '/';
      }

      return normalizeAbsolutePath(path + fragment, this.history._hasPushState);
    };

    Router.prototype.navigate = function navigate(fragment, options) {
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
    };

    Router.prototype.navigateToRoute = function navigateToRoute(route, params, options) {
      var path = this.generate(route, params);
      return this.navigate(path, options);
    };

    Router.prototype.navigateBack = function navigateBack() {
      this.history.navigateBack();
    };

    Router.prototype.createChild = function createChild(container) {
      var childRouter = new Router(container || this.container.createChild(), this.history);
      childRouter.parent = this;
      return childRouter;
    };

    Router.prototype.createNavigationInstruction = function createNavigationInstruction() {
      var url = arguments[0] === undefined ? '' : arguments[0];
      var parentInstruction = arguments[1] === undefined ? null : arguments[1];

      var fragment = url;
      var queryString = '';

      var queryIndex = url.indexOf('?');
      if (queryIndex != -1) {
        fragment = url.substr(0, queryIndex);
        queryString = url.substr(queryIndex + 1);
      }

      var results = this.recognizer.recognize(url);
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
        var first = results[0];
        var instruction = new _navigationInstruction.NavigationInstruction(fragment, queryString, first.params, first.queryParams || results.queryParams, first.config || first.handler, parentInstruction);

        if (typeof first.handler === 'function') {
          return evaluateNavigationStrategy(instruction, first.handler, first);
        } else if (first.config && 'navigationStrategy' in first.config) {
          return evaluateNavigationStrategy(instruction, first.config.navigationStrategy, first.config);
        }

        return Promise.resolve(instruction);
      }

      return Promise.reject(new Error('Route not found: ' + url));
    };

    Router.prototype.createNavigationContext = function createNavigationContext(instruction) {
      return new _navigationContext.NavigationContext(this, instruction);
    };

    Router.prototype.generate = function generate(name, params) {
      if ((!this.isConfigured || !this.recognizer.hasRoute(name)) && this.parent) {
        return this.parent.generate(name, params);
      }

      var path = this.recognizer.generate(name, params);
      return this.createRootedPath(path);
    };

    Router.prototype.addRoute = function addRoute(config) {
      var navModel = arguments[1] === undefined ? {} : arguments[1];

      validateRouteConfig(config);

      if (!('viewPorts' in config)) {
        config.viewPorts = {
          'default': {
            moduleId: config.moduleId,
            view: config.view
          }
        };
      }

      navModel.title = navModel.title || config.title;
      navModel.setTitle = function (newTitle) {
        navModel.title = newTitle;
      };
      navModel.settings = config.settings || (config.settings = {});

      this.routes.push(config);
      var state = this.recognizer.add({ path: config.route, handler: config });

      if (config.route) {
        var withChild,
            settings = config.settings;
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
        this.navigation = this.navigation.sort(function (a, b) {
          return a.order - b.order;
        });
      }
    };

    Router.prototype.hasRoute = function hasRoute(name) {
      return !!(this.recognizer.hasRoute(name) || this.parent && this.parent.hasRoute(name));
    };

    Router.prototype.hasOwnRoute = function hasOwnRoute(name) {
      return this.recognizer.hasRoute(name);
    };

    Router.prototype.handleUnknownRoutes = function handleUnknownRoutes(config) {
      var callback = function callback(instruction) {
        return new Promise(function (resolve, reject) {
          function done(inst) {
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
            _util.processPotential(config(instruction), done, reject);
          } else {
            instruction.config = config;
            done(instruction);
          }
        });
      };

      this.catchAllHandler = callback;
    };

    Router.prototype.reset = function reset() {
      this.fallbackOrder = 100;
      this.recognizer = new _aureliaRouteRecognizer.RouteRecognizer();
      this.childRecognizer = new _aureliaRouteRecognizer.RouteRecognizer();
      this.routes = [];
      this.isNavigating = false;
      this.navigation = [];
      this.isConfigured = false;
    };

    _createClass(Router, [{
      key: 'isRoot',
      get: function () {
        return false;
      }
    }]);

    return Router;
  })();

  exports.Router = Router;

  function validateRouteConfig(config) {
    var isValid = typeof config === 'object' && (config.moduleId || config.redirect || config.viewPorts) && config.route !== null && config.route !== undefined;

    if (!isValid) {
      throw new Error('Invalid Route Config: You must have at least a route and a moduleId, redirect, or viewPorts.');
    }
  }

  function normalizeAbsolutePath(path, hasPushState) {
    if (!hasPushState && path[0] !== '#') {
      path = '#' + path;
    }

    return path;
  }

  function evaluateNavigationStrategy(instruction, evaluator, context) {
    return Promise.resolve(evaluator.call(context, instruction)).then(function () {
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
});