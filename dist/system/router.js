System.register(['core-js', 'aurelia-route-recognizer', 'aurelia-path', './navigation-context', './navigation-instruction', './nav-model', './router-configuration', './util'], function (_export) {
  'use strict';

  var core, RouteRecognizer, join, NavigationContext, NavigationInstruction, NavModel, RouterConfiguration, processPotential, normalizeAbsolutePath, createRootedPath, resolveUrl, Router;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function validateRouteConfig(config) {
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
  return {
    setters: [function (_coreJs) {
      core = _coreJs['default'];
    }, function (_aureliaRouteRecognizer) {
      RouteRecognizer = _aureliaRouteRecognizer.RouteRecognizer;
    }, function (_aureliaPath) {
      join = _aureliaPath.join;
    }, function (_navigationContext) {
      NavigationContext = _navigationContext.NavigationContext;
    }, function (_navigationInstruction) {
      NavigationInstruction = _navigationInstruction.NavigationInstruction;
    }, function (_navModel) {
      NavModel = _navModel.NavModel;
    }, function (_routerConfiguration) {
      RouterConfiguration = _routerConfiguration.RouterConfiguration;
    }, function (_util) {
      processPotential = _util.processPotential;
      normalizeAbsolutePath = _util.normalizeAbsolutePath;
      createRootedPath = _util.createRootedPath;
      resolveUrl = _util.resolveUrl;
    }],
    execute: function () {
      Router = (function () {
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
            current.href = createRootedPath(current.relativeHref, this.baseUrl, this.history._hasPushState);
          }
        };

        Router.prototype.configure = function configure(callbackOrConfig) {
          this.isConfigured = true;

          if (typeof callbackOrConfig == 'function') {
            var config = new RouterConfiguration();
            callbackOrConfig(config);
            config.exportToRouter(this);
          } else {
            callbackOrConfig.exportToRouter(this);
          }

          return this;
        };

        Router.prototype.navigate = function navigate(fragment, options) {
          if (!this.isConfigured && this.parent) {
            return this.parent.navigate(fragment, options);
          }

          return this.history.navigate(resolveUrl(fragment, this.baseUrl, this.history._hasPushState), options);
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
            var instruction = new NavigationInstruction(fragment, queryString, first.params, first.queryParams || results.queryParams, first.config || first.handler, parentInstruction);

            if (typeof first.handler === 'function') {
              return evaluateNavigationStrategy(instruction, first.handler, first);
            } else if (first.handler && 'navigationStrategy' in first.handler) {
              return evaluateNavigationStrategy(instruction, first.handler.navigationStrategy, first.handler);
            }

            return Promise.resolve(instruction);
          }

          return Promise.reject(new Error('Route not found: ' + url));
        };

        Router.prototype.createNavigationContext = function createNavigationContext(instruction) {
          instruction.navigationContext = new NavigationContext(this, instruction);
          return instruction.navigationContext;
        };

        Router.prototype.generate = function generate(name, params) {
          if ((!this.isConfigured || !this.recognizer.hasRoute(name)) && this.parent) {
            return this.parent.generate(name, params);
          }

          var path = this.recognizer.generate(name, params);
          return createRootedPath(path, this.baseUrl, this.history._hasPushState);
        };

        Router.prototype.createNavModel = function createNavModel(config) {
          var navModel = new NavModel(this, 'href' in config ? config.href : config.route);
          navModel.title = config.title;
          navModel.order = config.nav;
          navModel.href = config.href;
          navModel.settings = config.settings;
          navModel.config = config;

          return navModel;
        };

        Router.prototype.addRoute = function addRoute(config, navModel) {
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
          var state = this.recognizer.add({ path: config.route, handler: config });

          if (config.route) {
            var withChild = undefined,
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

          if ((navModel.order || navModel.order === 0) && this.navigation.indexOf(navModel) === -1) {
            if (!navModel.href && navModel.href != '' && (state.types.dynamics || state.types.stars)) {
              throw new Error('Invalid route config: dynamic routes must specify an href to be included in the navigation model.');
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
                processPotential(config(instruction), done, reject);
              } else {
                instruction.config = config;
                done(instruction);
              }
            });
          };

          this.catchAllHandler = callback;
        };

        Router.prototype.updateTitle = function updateTitle() {
          if (this.parent) {
            return this.parent.updateTitle();
          }

          this.currentInstruction.navigationContext.updateTitle();
        };

        Router.prototype.reset = function reset() {
          this.fallbackOrder = 100;
          this.recognizer = new RouteRecognizer();
          this.childRecognizer = new RouteRecognizer();
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

      _export('Router', Router);
    }
  };
});