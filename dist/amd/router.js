define(["exports", "aurelia-route-recognizer", "aurelia-path", "./navigation-context", "./navigation-instruction", "./router-configuration", "./util"], function (exports, _aureliaRouteRecognizer, _aureliaPath, _navigationContext, _navigationInstruction, _routerConfiguration, _util) {
  "use strict";

  var RouteRecognizer = _aureliaRouteRecognizer.RouteRecognizer;
  var join = _aureliaPath.join;
  var NavigationContext = _navigationContext.NavigationContext;
  var NavigationInstruction = _navigationInstruction.NavigationInstruction;
  var RouterConfiguration = _routerConfiguration.RouterConfiguration;
  var processPotential = _util.processPotential;
  var Router = (function () {
    var Router = function Router(history) {
      this.history = history;
      this.viewPorts = {};
      this.reset();
      this.baseUrl = "";
    };

    Router.prototype.registerViewPort = function (viewPort, name) {
      var _this = this;
      name = name || "default";

      if (typeof this.viewPorts[name] == "function") {
        var callback = this.viewPorts[name];
        this.viewPorts[name] = viewPort;
        this.configureRouterForViewPort(viewPort, callback);
      } else {
        this.configureRouterForViewPort(viewPort, function () {
          if (typeof _this.viewPorts[name] == "function") {
            var callback = _this.viewPorts[name];
            _this.viewPorts[name] = viewPort;
            callback(viewPort);
          } else {
            _this.viewPorts[name] = viewPort;
          }
        });
      }
    };

    Router.prototype.configureRouterForViewPort = function (viewPort, callback) {
      if ("configureRouter" in viewPort.executionContext) {
        var result = viewPort.executionContext.configureRouter() || Promise.resolve();
        result.then(function () {
          return callback(viewPort);
        });
      } else {
        callback(viewPort);
      }
    };

    Router.prototype.refreshBaseUrl = function () {
      if (this.parent) {
        var baseUrl = this.parent.currentInstruction.getBaseUrl();
        this.baseUrl = this.parent.baseUrl + baseUrl;
      }
    };

    Router.prototype.refreshNavigation = function () {
      var nav = this.navigation;

      for (var i = 0, length = nav.length; i < length; i++) {
        var current = nav[i];

        if (this.baseUrl[0] == "/") {
          current.href = "#" + this.baseUrl;
        } else {
          current.href = "#/" + this.baseUrl;
        }

        if (current.href[current.href.length - 1] != "/") {
          current.href += "/";
        }

        current.href += current.relativeHref;
      }
    };

    Router.prototype.configure = function (callbackOrConfig) {
      if (typeof callbackOrConfig == "function") {
        var config = new RouterConfiguration();
        callbackOrConfig(config);
        config.exportToRouter(this);
      } else {
        callbackOrConfig.exportToRouter(this);
      }

      return this;
    };

    Router.prototype.navigate = function (fragment, options) {
      fragment = join(this.baseUrl, fragment);
      return this.history.navigate(fragment, options);
    };

    Router.prototype.navigateBack = function () {
      this.history.navigateBack();
    };

    Router.prototype.createChild = function () {
      var childRouter = new Router(this.history);
      childRouter.parent = this;
      return childRouter;
    };

    Router.prototype.createNavigationInstruction = function (url, parentInstruction) {
      if (url === undefined) url = "";
      if (parentInstruction === undefined) parentInstruction = null;
      var results = this.recognizer.recognize(url);

      if (!results || !results.length) {
        results = this.childRecognizer.recognize(url);
      }

      if (results && results.length) {
        var first = results[0], fragment = url, queryIndex = fragment.indexOf("?"), queryString;

        if (queryIndex != -1) {
          fragment = url.substr(0, queryIndex);
          queryString = url.substr(queryIndex + 1);
        }

        var instruction = new NavigationInstruction(fragment, queryString, first.params, first.queryParams, first.handler, parentInstruction);

        if (typeof first.handler == "function") {
          instruction.config = {};
          return first.handler(instruction);
        }

        return Promise.resolve(instruction);
      } else {
        return Promise.reject(new Error("Route Not Found: " + url));
      }
    };

    Router.prototype.createNavigationContext = function (instruction) {
      return new NavigationContext(this, instruction);
    };

    Router.prototype.generate = function (name, params) {
      return this.recognizer.generate(name, params);
    };

    Router.prototype.addRoute = function (config, navModel) {
      if (navModel === undefined) navModel = {};
      if (!("viewPorts" in config)) {
        config.viewPorts = {
          "default": {
            moduleId: config.moduleId
          }
        };
      }

      navModel.title = navModel.title || config.title;

      this.routes.push(config);
      this.recognizer.add([{ path: config.route, handler: config }]);

      if (config.route) {
        var withChild = JSON.parse(JSON.stringify(config));
        withChild.route += "/*childRoute";
        withChild.hasChildRouter = true;
        this.childRecognizer.add([{
          path: withChild.route,
          handler: withChild
        }]);

        withChild.navModel = navModel;
      }

      config.navModel = navModel;

      if (("nav" in config || "order" in navModel) && this.navigation.indexOf(navModel) === -1) {
        navModel.order = navModel.order || config.nav;
        navModel.href = navModel.href || config.href;
        navModel.isActive = false;
        navModel.config = config;

        if (!config.href) {
          navModel.relativeHref = config.route;
          navModel.href = "";
        }

        if (typeof navModel.order != "number") {
          navModel.order = ++this.fallbackOrder;
        }

        this.navigation.push(navModel);
        this.navigation = this.navigation.sort(function (a, b) {
          return a.order - b.order;
        });
      }
    };

    Router.prototype.handleUnknownRoutes = function (config) {
      var catchAllPattern = "*path";

      var callback = function (instruction) {
        return new Promise(function (resolve, reject) {
          function done(inst) {
            inst = inst || instruction;
            inst.config.route = catchAllPattern;
            resolve(inst);
          }

          if (!config) {
            instruction.config.moduleId = instruction.fragment;
            done(instruction);
          } else if (typeof config == "string") {
            instruction.config.moduleId = config;
            done(instruction);
          } else if (typeof config == "function") {
            processPotential(config(instruction), done, reject);
          } else {
            instruction.config = config;
            done(instruction);
          }
        });
      };

      this.childRecognizer.add([{
        path: catchAllPattern,
        handler: callback
      }]);
    };

    Router.prototype.reset = function () {
      this.fallbackOrder = 100;
      this.recognizer = new RouteRecognizer();
      this.childRecognizer = new RouteRecognizer();
      this.routes = [];
      this.isNavigating = false;
      this.navigation = [];
    };

    return Router;
  })();

  exports.Router = Router;
});