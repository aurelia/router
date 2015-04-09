System.register(['core-js', 'aurelia-route-recognizer', 'aurelia-path', './navigation-context', './navigation-instruction', './router-configuration', './util'], function (_export) {
  var core, RouteRecognizer, join, NavigationContext, NavigationInstruction, RouterConfiguration, processPotential, _classCallCheck, _createClass, Router;

  function validateRouteConfig(config) {
    var isValid = typeof config === 'object' && config.moduleId && config.route !== null && config.route !== undefined;

    if (!isValid) {
      throw new Error('Invalid route config.');
    }
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
    }, function (_routerConfiguration) {
      RouterConfiguration = _routerConfiguration.RouterConfiguration;
    }, function (_util) {
      processPotential = _util.processPotential;
    }],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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

        _createClass(Router, [{
          key: 'isRoot',
          get: function () {
            return false;
          }
        }, {
          key: 'registerViewPort',
          value: function registerViewPort(viewPort, name) {
            name = name || 'default';
            this.viewPorts[name] = viewPort;
          }
        }, {
          key: 'refreshBaseUrl',
          value: function refreshBaseUrl() {
            if (this.parent) {
              var baseUrl = this.parent.currentInstruction.getBaseUrl();
              this.baseUrl = this.parent.baseUrl + baseUrl;
            }
          }
        }, {
          key: 'refreshNavigation',
          value: function refreshNavigation() {
            var nav = this.navigation;

            for (var i = 0, length = nav.length; i < length; i++) {
              var current = nav[i];

              if (!this.history._hasPushState) {
                if (this.baseUrl[0] == '/') {
                  current.href = '#' + this.baseUrl;
                } else {
                  current.href = '#/' + this.baseUrl;
                }
              } else {
                current.href = '/' + this.baseUrl;
              }

              if (current.href[current.href.length - 1] != '/') {
                current.href += '/';
              }

              current.href += current.relativeHref;
            }
          }
        }, {
          key: 'configure',
          value: function configure(callbackOrConfig) {
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
        }, {
          key: 'navigate',
          value: function navigate(fragment, options) {
            if (!this.isConfigured && this.parent) {
              return this.parent.navigate(fragment, options);
            }

            fragment = join(this.baseUrl, fragment);
            if (fragment === '') fragment = '/';
            return this.history.navigate(fragment, options);
          }
        }, {
          key: 'navigateBack',
          value: function navigateBack() {
            this.history.navigateBack();
          }
        }, {
          key: 'createChild',
          value: function createChild(container) {
            var childRouter = new Router(container || this.container.createChild(), this.history);
            childRouter.parent = this;
            return childRouter;
          }
        }, {
          key: 'createNavigationInstruction',
          value: function createNavigationInstruction() {
            var url = arguments[0] === undefined ? '' : arguments[0];
            var parentInstruction = arguments[1] === undefined ? null : arguments[1];

            var results = this.recognizer.recognize(url);
            var fragment, queryIndex, queryString;

            if (!results || !results.length) {
              results = this.childRecognizer.recognize(url);
            }

            fragment = url;
            queryIndex = fragment.indexOf('?');

            if (queryIndex != -1) {
              fragment = url.substr(0, queryIndex);
              queryString = url.substr(queryIndex + 1);
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
              var first = results[0],
                  fragment = url,
                  queryIndex = fragment.indexOf('?'),
                  queryString;

              if (queryIndex != -1) {
                fragment = url.substr(0, queryIndex);
                queryString = url.substr(queryIndex + 1);
              }

              var instruction = new NavigationInstruction(fragment, queryString, first.params, first.queryParams || results.queryParams, first.config || first.handler, parentInstruction);

              if (typeof first.handler == 'function') {
                return first.handler(instruction).then(function (instruction) {
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

              return Promise.resolve(instruction);
            } else {
              return Promise.reject(new Error('Route Not Found: ' + url));
            }
          }
        }, {
          key: 'createNavigationContext',
          value: function createNavigationContext(instruction) {
            return new NavigationContext(this, instruction);
          }
        }, {
          key: 'generate',
          value: function generate(name, params, options) {
            options = options || {};
            if ((!this.isConfigured || !this.recognizer.hasRoute(name)) && this.parent) {
              return this.parent.generate(name, params, options);
            }

            var root = '';
            var path = this.recognizer.generate(name, params);
            if (options.absolute) {
              root = (this.history.root || '') + this.baseUrl;
            }

            return root + path;
          }
        }, {
          key: 'addRoute',
          value: function addRoute(config) {
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
          }
        }, {
          key: 'hasRoute',
          value: function hasRoute(name) {
            return !!(this.recognizer.hasRoute(name) || this.parent && this.parent.hasRoute(name));
          }
        }, {
          key: 'hasOwnRoute',
          value: function hasOwnRoute(name) {
            return this.recognizer.hasRoute(name);
          }
        }, {
          key: 'handleUnknownRoutes',
          value: function handleUnknownRoutes(config) {
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
          }
        }, {
          key: 'reset',
          value: function reset() {
            this.fallbackOrder = 100;
            this.recognizer = new RouteRecognizer();
            this.childRecognizer = new RouteRecognizer();
            this.routes = [];
            this.isNavigating = false;
            this.navigation = [];
            this.isConfigured = false;
          }
        }]);

        return Router;
      })();

      _export('Router', Router);
    }
  };
});