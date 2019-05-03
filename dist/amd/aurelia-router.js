define('aurelia-router', ['exports', 'aurelia-logging', 'aurelia-dependency-injection', 'aurelia-history', 'aurelia-route-recognizer', 'aurelia-event-aggregator'], function (exports, LogManager, aureliaDependencyInjection, aureliaHistory, aureliaRouteRecognizer, aureliaEventAggregator) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    /**
     * Class used to represent an instruction during a navigation.
     */
    var NavigationInstruction = /** @class */ (function () {
        function NavigationInstruction(init) {
            /**
             * Current built viewport plan of this nav instruction
             */
            this.plan = null;
            this.options = {};
            Object.assign(this, init);
            this.params = this.params || {};
            this.viewPortInstructions = {};
            var ancestorParams = [];
            var current = this;
            do {
                var currentParams = Object.assign({}, current.params);
                if (current.config && current.config.hasChildRouter) {
                    // remove the param for the injected child route segment
                    delete currentParams[current.getWildCardName()];
                }
                ancestorParams.unshift(currentParams);
                current = current.parentInstruction;
            } while (current);
            var allParams = Object.assign.apply(Object, [{}, this.queryParams].concat(ancestorParams));
            this.lifecycleArgs = [allParams, this.config, this];
        }
        /**
         * Gets an array containing this instruction and all child instructions for the current navigation.
         */
        NavigationInstruction.prototype.getAllInstructions = function () {
            var instructions = [this];
            var viewPortInstructions = this.viewPortInstructions;
            for (var key in viewPortInstructions) {
                var childInstruction = viewPortInstructions[key].childNavigationInstruction;
                if (childInstruction) {
                    instructions.push.apply(instructions, childInstruction.getAllInstructions());
                }
            }
            return instructions;
        };
        /**
         * Gets an array containing the instruction and all child instructions for the previous navigation.
         * Previous instructions are no longer available after navigation completes.
         */
        NavigationInstruction.prototype.getAllPreviousInstructions = function () {
            return this.getAllInstructions().map(function (c) { return c.previousInstruction; }).filter(function (c) { return c; });
        };
        NavigationInstruction.prototype.addViewPortInstruction = function (nameOrInitOptions, strategy, moduleId, component) {
            var viewPortInstruction;
            var viewPortName = typeof nameOrInitOptions === 'string' ? nameOrInitOptions : nameOrInitOptions.name;
            var lifecycleArgs = this.lifecycleArgs;
            var config = Object.assign({}, lifecycleArgs[1], { currentViewPort: viewPortName });
            if (typeof nameOrInitOptions === 'string') {
                viewPortInstruction = {
                    name: nameOrInitOptions,
                    strategy: strategy,
                    moduleId: moduleId,
                    component: component,
                    childRouter: component.childRouter,
                    lifecycleArgs: [lifecycleArgs[0], config, lifecycleArgs[2]]
                };
            }
            else {
                viewPortInstruction = {
                    name: viewPortName,
                    strategy: nameOrInitOptions.strategy,
                    component: nameOrInitOptions.component,
                    moduleId: nameOrInitOptions.moduleId,
                    childRouter: nameOrInitOptions.component.childRouter,
                    lifecycleArgs: [lifecycleArgs[0], config, lifecycleArgs[2]]
                };
            }
            return this.viewPortInstructions[viewPortName] = viewPortInstruction;
        };
        /**
         * Gets the name of the route pattern's wildcard parameter, if applicable.
         */
        NavigationInstruction.prototype.getWildCardName = function () {
            // todo: potential issue, or at least unsafe typings
            var configRoute = this.config.route;
            var wildcardIndex = configRoute.lastIndexOf('*');
            return configRoute.substr(wildcardIndex + 1);
        };
        /**
         * Gets the path and query string created by filling the route
         * pattern's wildcard parameter with the matching param.
         */
        NavigationInstruction.prototype.getWildcardPath = function () {
            var wildcardName = this.getWildCardName();
            var path = this.params[wildcardName] || '';
            var queryString = this.queryString;
            if (queryString) {
                path += '?' + queryString;
            }
            return path;
        };
        /**
         * Gets the instruction's base URL, accounting for wildcard route parameters.
         */
        NavigationInstruction.prototype.getBaseUrl = function () {
            var _this = this;
            var $encodeURI = encodeURI;
            var fragment = decodeURI(this.fragment);
            if (fragment === '') {
                var nonEmptyRoute = this.router.routes.find(function (route) {
                    return route.name === _this.config.name &&
                        route.route !== '';
                });
                if (nonEmptyRoute) {
                    fragment = nonEmptyRoute.route;
                }
            }
            if (!this.params) {
                return $encodeURI(fragment);
            }
            var wildcardName = this.getWildCardName();
            var path = this.params[wildcardName] || '';
            if (!path) {
                return $encodeURI(fragment);
            }
            return $encodeURI(fragment.substr(0, fragment.lastIndexOf(path)));
        };
        /**
         * Finalize a viewport instruction
         * @internal
         */
        NavigationInstruction.prototype._commitChanges = function (waitToSwap) {
            var _this = this;
            var router = this.router;
            router.currentInstruction = this;
            var previousInstruction = this.previousInstruction;
            if (previousInstruction) {
                previousInstruction.config.navModel.isActive = false;
            }
            this.config.navModel.isActive = true;
            router.refreshNavigation();
            var loads = [];
            var delaySwaps = [];
            var viewPortInstructions = this.viewPortInstructions;
            var _loop_1 = function (viewPortName) {
                var viewPortInstruction = viewPortInstructions[viewPortName];
                var viewPort = router.viewPorts[viewPortName];
                if (!viewPort) {
                    throw new Error("There was no router-view found in the view for " + viewPortInstruction.moduleId + ".");
                }
                var childNavInstruction = viewPortInstruction.childNavigationInstruction;
                if (viewPortInstruction.strategy === "replace" /* Replace */) {
                    if (childNavInstruction && childNavInstruction.parentCatchHandler) {
                        loads.push(childNavInstruction._commitChanges(waitToSwap));
                    }
                    else {
                        if (waitToSwap) {
                            delaySwaps.push({ viewPort: viewPort, viewPortInstruction: viewPortInstruction });
                        }
                        loads.push(viewPort
                            .process(viewPortInstruction, waitToSwap)
                            .then(function () { return childNavInstruction
                            ? childNavInstruction._commitChanges(waitToSwap)
                            : Promise.resolve(); }));
                    }
                }
                else {
                    if (childNavInstruction) {
                        loads.push(childNavInstruction._commitChanges(waitToSwap));
                    }
                }
            };
            for (var viewPortName in viewPortInstructions) {
                _loop_1(viewPortName);
            }
            return Promise
                .all(loads)
                .then(function () {
                delaySwaps.forEach(function (x) { return x.viewPort.swap(x.viewPortInstruction); });
                return null;
            })
                .then(function () { return prune(_this); });
        };
        /**@internal */
        NavigationInstruction.prototype._updateTitle = function () {
            var router = this.router;
            var title = this._buildTitle(router.titleSeparator);
            if (title) {
                router.history.setTitle(title);
            }
        };
        /**@internal */
        NavigationInstruction.prototype._buildTitle = function (separator) {
            if (separator === void 0) { separator = ' | '; }
            var title = '';
            var childTitles = [];
            var navModelTitle = this.config.navModel.title;
            var instructionRouter = this.router;
            var viewPortInstructions = this.viewPortInstructions;
            if (navModelTitle) {
                title = instructionRouter.transformTitle(navModelTitle);
            }
            for (var viewPortName in viewPortInstructions) {
                var viewPortInstruction = viewPortInstructions[viewPortName];
                var child_nav_instruction = viewPortInstruction.childNavigationInstruction;
                if (child_nav_instruction) {
                    var childTitle = child_nav_instruction._buildTitle(separator);
                    if (childTitle) {
                        childTitles.push(childTitle);
                    }
                }
            }
            if (childTitles.length) {
                title = childTitles.join(separator) + (title ? separator : '') + title;
            }
            if (instructionRouter.title) {
                title += (title ? separator : '') + instructionRouter.transformTitle(instructionRouter.title);
            }
            return title;
        };
        return NavigationInstruction;
    }());
    var prune = function (instruction) {
        instruction.previousInstruction = null;
        instruction.plan = null;
    };

    /**
    * Class for storing and interacting with a route's navigation settings.
    */
    var NavModel = /** @class */ (function () {
        function NavModel(router, relativeHref) {
            /**
            * True if this nav item is currently active.
            */
            this.isActive = false;
            /**
            * The title.
            */
            this.title = null;
            /**
            * This nav item's absolute href.
            */
            this.href = null;
            /**
            * This nav item's relative href.
            */
            this.relativeHref = null;
            /**
            * Data attached to the route at configuration time.
            */
            this.settings = {};
            /**
            * The route config.
            */
            this.config = null;
            this.router = router;
            this.relativeHref = relativeHref;
        }
        /**
        * Sets the route's title and updates document.title.
        *  If the a navigation is in progress, the change will be applied
        *  to document.title when the navigation completes.
        *
        * @param title The new title.
        */
        NavModel.prototype.setTitle = function (title) {
            this.title = title;
            if (this.isActive) {
                this.router.updateTitle();
            }
        };
        return NavModel;
    }());

    function _normalizeAbsolutePath(path, hasPushState, absolute) {
        if (absolute === void 0) { absolute = false; }
        if (!hasPushState && path[0] !== '#') {
            path = '#' + path;
        }
        if (hasPushState && absolute) {
            path = path.substring(1, path.length);
        }
        return path;
    }
    function _createRootedPath(fragment, baseUrl, hasPushState, absolute) {
        if (isAbsoluteUrl.test(fragment)) {
            return fragment;
        }
        var path = '';
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
    function _resolveUrl(fragment, baseUrl, hasPushState) {
        if (isRootedPath.test(fragment)) {
            return _normalizeAbsolutePath(fragment, hasPushState);
        }
        return _createRootedPath(fragment, baseUrl, hasPushState);
    }
    function _ensureArrayWithSingleRoutePerConfig(config) {
        var routeConfigs = [];
        if (Array.isArray(config.route)) {
            for (var i = 0, ii = config.route.length; i < ii; ++i) {
                var current = Object.assign({}, config);
                current.route = config.route[i];
                routeConfigs.push(current);
            }
        }
        else {
            routeConfigs.push(Object.assign({}, config));
        }
        return routeConfigs;
    }
    var isRootedPath = /^#?\//;
    var isAbsoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;

    /**
     * Class used to configure a [[Router]] instance.
     *
     * @constructor
     */
    var RouterConfiguration = /** @class */ (function () {
        function RouterConfiguration() {
            this.instructions = [];
            this.options = {};
            this.pipelineSteps = [];
        }
        /**
         * Adds a step to be run during the [[Router]]'s navigation pipeline.
         *
         * @param name The name of the pipeline slot to insert the step into.
         * @param step The pipeline step.
         * @chainable
         */
        RouterConfiguration.prototype.addPipelineStep = function (name, step) {
            if (step === null || step === undefined) {
                throw new Error('Pipeline step cannot be null or undefined.');
            }
            this.pipelineSteps.push({ name: name, step: step });
            return this;
        };
        /**
         * Adds a step to be run during the [[Router]]'s authorize pipeline slot.
         *
         * @param step The pipeline step.
         * @chainable
         */
        RouterConfiguration.prototype.addAuthorizeStep = function (step) {
            return this.addPipelineStep("authorize" /* Authorize */, step);
        };
        /**
         * Adds a step to be run during the [[Router]]'s preActivate pipeline slot.
         *
         * @param step The pipeline step.
         * @chainable
         */
        RouterConfiguration.prototype.addPreActivateStep = function (step) {
            return this.addPipelineStep("preActivate" /* PreActivate */, step);
        };
        /**
         * Adds a step to be run during the [[Router]]'s preRender pipeline slot.
         *
         * @param step The pipeline step.
         * @chainable
         */
        RouterConfiguration.prototype.addPreRenderStep = function (step) {
            return this.addPipelineStep("preRender" /* PreRender */, step);
        };
        /**
         * Adds a step to be run during the [[Router]]'s postRender pipeline slot.
         *
         * @param step The pipeline step.
         * @chainable
         */
        RouterConfiguration.prototype.addPostRenderStep = function (step) {
            return this.addPipelineStep("postRender" /* PostRender */, step);
        };
        /**
         * Configures a route that will be used if there is no previous location available on navigation cancellation.
         *
         * @param fragment The URL fragment to use as the navigation destination.
         * @chainable
         */
        RouterConfiguration.prototype.fallbackRoute = function (fragment) {
            this._fallbackRoute = fragment;
            return this;
        };
        /**
         * Maps one or more routes to be registered with the router.
         *
         * @param route The [[RouteConfig]] to map, or an array of [[RouteConfig]] to map.
         * @chainable
         */
        RouterConfiguration.prototype.map = function (route) {
            var _this = this;
            if (Array.isArray(route)) {
                route.forEach(function (r) { return _this.map(r); });
                return this;
            }
            return this.mapRoute(route);
        };
        /**
         * Configures defaults to use for any view ports.
         *
         * @param viewPortConfig a view port configuration object to use as a
         *  default, of the form { viewPortName: { moduleId } }.
         * @chainable
         */
        RouterConfiguration.prototype.useViewPortDefaults = function (viewPortConfig) {
            this.viewPortDefaults = viewPortConfig;
            return this;
        };
        /**
         * Maps a single route to be registered with the router.
         *
         * @param route The [[RouteConfig]] to map.
         * @chainable
         */
        RouterConfiguration.prototype.mapRoute = function (config) {
            this.instructions.push(function (router) {
                var routeConfigs = _ensureArrayWithSingleRoutePerConfig(config);
                var navModel;
                for (var i = 0, ii = routeConfigs.length; i < ii; ++i) {
                    var routeConfig = routeConfigs[i];
                    routeConfig.settings = routeConfig.settings || {};
                    if (!navModel) {
                        navModel = router.createNavModel(routeConfig);
                    }
                    router.addRoute(routeConfig, navModel);
                }
            });
            return this;
        };
        /**
         * Registers an unknown route handler to be run when the URL fragment doesn't match any registered routes.
         *
         * @param config A string containing a moduleId to load, or a [[RouteConfig]], or a function that takes the
         *  [[NavigationInstruction]] and selects a moduleId to load.
         * @chainable
         */
        RouterConfiguration.prototype.mapUnknownRoutes = function (config) {
            this.unknownRouteConfig = config;
            return this;
        };
        /**
         * Applies the current configuration to the specified [[Router]].
         *
         * @param router The [[Router]] to apply the configuration to.
         */
        RouterConfiguration.prototype.exportToRouter = function (router) {
            var instructions = this.instructions;
            for (var i = 0, ii = instructions.length; i < ii; ++i) {
                instructions[i](router);
            }
            var _a = this, title = _a.title, titleSeparator = _a.titleSeparator, unknownRouteConfig = _a.unknownRouteConfig, _fallbackRoute = _a._fallbackRoute, viewPortDefaults = _a.viewPortDefaults;
            if (title) {
                router.title = title;
            }
            if (titleSeparator) {
                router.titleSeparator = titleSeparator;
            }
            if (unknownRouteConfig) {
                router.handleUnknownRoutes(unknownRouteConfig);
            }
            if (_fallbackRoute) {
                router.fallbackRoute = _fallbackRoute;
            }
            if (viewPortDefaults) {
                router.useViewPortDefaults(viewPortDefaults);
            }
            Object.assign(router.options, this.options);
            var pipelineSteps = this.pipelineSteps;
            var pipelineStepCount = pipelineSteps.length;
            if (pipelineStepCount) {
                if (!router.isRoot) {
                    throw new Error('Pipeline steps can only be added to the root router');
                }
                var pipelineProvider = router.pipelineProvider;
                for (var i = 0, ii = pipelineStepCount; i < ii; ++i) {
                    var _b = pipelineSteps[i], name_1 = _b.name, step = _b.step;
                    pipelineProvider.addStep(name_1, step);
                }
            }
        };
        return RouterConfiguration;
    }());

    /**
     * The primary class responsible for handling routing and navigation.
     */
    var Router = /** @class */ (function () {
        /**
         * @param container The [[Container]] to use when child routers.
         * @param history The [[History]] implementation to delegate navigation requests to.
         */
        function Router(container, history) {
            var _this = this;
            /**
             * The parent router, or null if this instance is not a child router.
             */
            this.parent = null;
            this.options = {};
            /**
             * The defaults used when a viewport lacks specified content
             */
            this.viewPortDefaults = {};
            /**
             * Extension point to transform the document title before it is built and displayed.
             * By default, child routers delegate to the parent router, and the app router
             * returns the title unchanged.
             */
            this.transformTitle = function (title) {
                if (_this.parent) {
                    return _this.parent.transformTitle(title);
                }
                return title;
            };
            this.container = container;
            this.history = history;
            this.reset();
        }
        /**
         * Fully resets the router's internal state. Primarily used internally by the framework when multiple calls to setRoot are made.
         * Use with caution (actually, avoid using this). Do not use this to simply change your navigation model.
         */
        Router.prototype.reset = function () {
            var _this = this;
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
            this._recognizer = new aureliaRouteRecognizer.RouteRecognizer();
            this._childRecognizer = new aureliaRouteRecognizer.RouteRecognizer();
            this._configuredPromise = new Promise(function (resolve) {
                _this._resolveConfiguredPromise = resolve;
            });
        };
        Object.defineProperty(Router.prototype, "isRoot", {
            /**
             * Gets a value indicating whether or not this [[Router]] is the root in the router tree. I.e., it has no parent.
             */
            get: function () {
                return !this.parent;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Registers a viewPort to be used as a rendering target for activated routes.
         *
         * @param viewPort The viewPort.
         * @param name The name of the viewPort. 'default' if unspecified.
         */
        Router.prototype.registerViewPort = function (viewPort, name) {
            name = name || 'default';
            this.viewPorts[name] = viewPort;
        };
        /**
         * Returns a Promise that resolves when the router is configured.
         */
        Router.prototype.ensureConfigured = function () {
            return this._configuredPromise;
        };
        /**
         * Configures the router.
         *
         * @param callbackOrConfig The [[RouterConfiguration]] or a callback that takes a [[RouterConfiguration]].
         */
        Router.prototype.configure = function (callbackOrConfig) {
            var _this = this;
            this.isConfigured = true;
            var result = callbackOrConfig;
            var config;
            if (typeof callbackOrConfig === 'function') {
                config = new RouterConfiguration();
                result = callbackOrConfig(config);
            }
            return Promise
                .resolve(result)
                .then(function (c) {
                if (c && c.exportToRouter) {
                    config = c;
                }
                config.exportToRouter(_this);
                _this.isConfigured = true;
                _this._resolveConfiguredPromise();
            });
        };
        /**
         * Navigates to a new location.
         *
         * @param fragment The URL fragment to use as the navigation destination.
         * @param options The navigation options.
         */
        Router.prototype.navigate = function (fragment, options) {
            if (!this.isConfigured && this.parent) {
                return this.parent.navigate(fragment, options);
            }
            this.isExplicitNavigation = true;
            return this.history.navigate(_resolveUrl(fragment, this.baseUrl, this.history._hasPushState), options);
        };
        /**
         * Navigates to a new location corresponding to the route and params specified. Equivallent to [[Router.generate]] followed
         * by [[Router.navigate]].
         *
         * @param route The name of the route to use when generating the navigation location.
         * @param params The route parameters to be used when populating the route pattern.
         * @param options The navigation options.
         */
        Router.prototype.navigateToRoute = function (route, params, options) {
            var path = this.generate(route, params);
            return this.navigate(path, options);
        };
        /**
         * Navigates back to the most recent location in history.
         */
        Router.prototype.navigateBack = function () {
            this.isExplicitNavigationBack = true;
            this.history.navigateBack();
        };
        /**
         * Creates a child router of the current router.
         *
         * @param container The [[Container]] to provide to the child router. Uses the current [[Router]]'s [[Container]] if unspecified.
         * @returns {Router} The new child Router.
         */
        Router.prototype.createChild = function (container) {
            var childRouter = new Router(container || this.container.createChild(), this.history);
            childRouter.parent = this;
            return childRouter;
        };
        /**
         * Generates a URL fragment matching the specified route pattern.
         *
         * @param name The name of the route whose pattern should be used to generate the fragment.
         * @param params The route params to be used to populate the route pattern.
         * @param options If options.absolute = true, then absolute url will be generated; otherwise, it will be relative url.
         * @returns {string} A string containing the generated URL fragment.
         */
        Router.prototype.generate = function (nameOrRoute, params, options) {
            if (params === void 0) { params = {}; }
            if (options === void 0) { options = {}; }
            // A child recognizer generates routes for potential child routes. Any potential child route is added
            // to the childRoute property of params for the childRouter to recognize. When generating routes, we
            // use the childRecognizer when childRoute params are available to generate a child router enabled route.
            var recognizer = 'childRoute' in params ? this._childRecognizer : this._recognizer;
            var hasRoute = recognizer.hasRoute(nameOrRoute);
            if (!hasRoute) {
                if (this.parent) {
                    return this.parent.generate(nameOrRoute, params, options);
                }
                throw new Error("A route with name '" + nameOrRoute + "' could not be found. Check that `name: '" + nameOrRoute + "'` was specified in the route's config.");
            }
            var path = recognizer.generate(nameOrRoute, params);
            var rootedPath = _createRootedPath(path, this.baseUrl, this.history._hasPushState, options.absolute);
            return options.absolute ? "" + this.history.getAbsoluteRoot() + rootedPath : rootedPath;
        };
        /**
         * Creates a [[NavModel]] for the specified route config.
         *
         * @param config The route config.
         */
        Router.prototype.createNavModel = function (config) {
            var navModel = new NavModel(this, 'href' in config
                ? config.href
                // potential error when config.route is a string[] ?
                : config.route);
            navModel.title = config.title;
            navModel.order = config.nav;
            navModel.href = config.href;
            navModel.settings = config.settings;
            navModel.config = config;
            return navModel;
        };
        /**
         * Registers a new route with the router.
         *
         * @param config The [[RouteConfig]].
         * @param navModel The [[NavModel]] to use for the route. May be omitted for single-pattern routes.
         */
        Router.prototype.addRoute = function (config, navModel) {
            if (Array.isArray(config.route)) {
                var routeConfigs = _ensureArrayWithSingleRoutePerConfig(config);
                // the following is wrong. todo: fix this after TS refactoring release
                routeConfigs.forEach(this.addRoute.bind(this));
                return;
            }
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
            var path = config.route;
            if (path.charAt(0) === '/') {
                path = path.substr(1);
            }
            var caseSensitive = config.caseSensitive === true;
            var state = this._recognizer.add({
                path: path,
                handler: config,
                caseSensitive: caseSensitive
            });
            if (path) {
                var settings = config.settings;
                delete config.settings;
                var withChild = JSON.parse(JSON.stringify(config));
                config.settings = settings;
                withChild.route = path + "/*childRoute";
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
            var navigation = this.navigation;
            if ((navModel.order || navModel.order === 0) && navigation.indexOf(navModel) === -1) {
                if ((!navModel.href && navModel.href !== '') && (state.types.dynamics || state.types.stars)) {
                    throw new Error('Invalid route config for "' + config.route + '" : dynamic routes must specify an "href:" to be included in the navigation model.');
                }
                if (typeof navModel.order !== 'number') {
                    navModel.order = ++this._fallbackOrder;
                }
                navigation.push(navModel);
                // this is a potential error / inconsistency between browsers
                //
                // MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
                // If compareFunction(a, b) returns 0, leave a and b unchanged with respect to each other,
                // but sorted with respect to all different elements.
                // Note: the ECMAscript standard does not guarantee this behaviour,
                // and thus not all browsers (e.g. Mozilla versions dating back to at least 2003) respect this.
                navigation.sort(function (a, b) { return a.order - b.order; });
            }
        };
        /**
         * Gets a value indicating whether or not this [[Router]] or one of its ancestors has a route registered with the specified name.
         *
         * @param name The name of the route to check.
         */
        Router.prototype.hasRoute = function (name) {
            return !!(this._recognizer.hasRoute(name) || this.parent && this.parent.hasRoute(name));
        };
        /**
         * Gets a value indicating whether or not this [[Router]] has a route registered with the specified name.
         *
         * @param name The name of the route to check.
         */
        Router.prototype.hasOwnRoute = function (name) {
            return this._recognizer.hasRoute(name);
        };
        /**
         * Register a handler to use when the incoming URL fragment doesn't match any registered routes.
         *
         * @param config The moduleId, or a function that selects the moduleId, or a [[RouteConfig]].
         */
        Router.prototype.handleUnknownRoutes = function (config) {
            var _this = this;
            if (!config) {
                throw new Error('Invalid unknown route handler');
            }
            this.catchAllHandler = function (instruction) {
                return _this
                    ._createRouteConfig(config, instruction)
                    .then(function (c) {
                    instruction.config = c;
                    return instruction;
                });
            };
        };
        /**
         * Updates the document title using the current navigation instruction.
         */
        Router.prototype.updateTitle = function () {
            var parentRouter = this.parent;
            if (parentRouter) {
                return parentRouter.updateTitle();
            }
            var currentInstruction = this.currentInstruction;
            if (currentInstruction) {
                currentInstruction._updateTitle();
            }
            return undefined;
        };
        /**
         * Updates the navigation routes with hrefs relative to the current location.
         * Note: This method will likely move to a plugin in a future release.
         */
        Router.prototype.refreshNavigation = function () {
            var nav = this.navigation;
            for (var i = 0, length_1 = nav.length; i < length_1; i++) {
                var current = nav[i];
                if (!current.config.href) {
                    current.href = _createRootedPath(current.relativeHref, this.baseUrl, this.history._hasPushState);
                }
                else {
                    current.href = _normalizeAbsolutePath(current.config.href, this.history._hasPushState);
                }
            }
        };
        /**
         * Sets the default configuration for the view ports. This specifies how to
         *  populate a view port for which no module is specified. The default is
         *  an empty view/view-model pair.
         */
        Router.prototype.useViewPortDefaults = function ($viewPortDefaults) {
            // a workaround to have strong typings while not requiring to expose interface ViewPortInstruction
            var viewPortDefaults = $viewPortDefaults;
            for (var viewPortName in viewPortDefaults) {
                var viewPortConfig = viewPortDefaults[viewPortName];
                this.viewPortDefaults[viewPortName] = {
                    moduleId: viewPortConfig.moduleId
                };
            }
        };
        /**@internal */
        Router.prototype._refreshBaseUrl = function () {
            var parentRouter = this.parent;
            if (parentRouter) {
                this.baseUrl = generateBaseUrl(parentRouter, parentRouter.currentInstruction);
            }
        };
        /**@internal */
        Router.prototype._createNavigationInstruction = function (url, parentInstruction) {
            if (url === void 0) { url = ''; }
            if (parentInstruction === void 0) { parentInstruction = null; }
            var fragment = url;
            var queryString = '';
            var queryIndex = url.indexOf('?');
            if (queryIndex !== -1) {
                fragment = url.substr(0, queryIndex);
                queryString = url.substr(queryIndex + 1);
            }
            var urlRecognizationResults = this._recognizer.recognize(url);
            if (!urlRecognizationResults || !urlRecognizationResults.length) {
                urlRecognizationResults = this._childRecognizer.recognize(url);
            }
            var instructionInit = {
                fragment: fragment,
                queryString: queryString,
                config: null,
                parentInstruction: parentInstruction,
                previousInstruction: this.currentInstruction,
                router: this,
                options: {
                    compareQueryParams: this.options.compareQueryParams
                }
            };
            var result;
            if (urlRecognizationResults && urlRecognizationResults.length) {
                var first = urlRecognizationResults[0];
                var instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
                    params: first.params,
                    queryParams: first.queryParams || urlRecognizationResults.queryParams,
                    config: first.config || first.handler
                }));
                if (typeof first.handler === 'function') {
                    result = evaluateNavigationStrategy(instruction, first.handler, first);
                }
                else if (first.handler && typeof first.handler.navigationStrategy === 'function') {
                    result = evaluateNavigationStrategy(instruction, first.handler.navigationStrategy, first.handler);
                }
                else {
                    result = Promise.resolve(instruction);
                }
            }
            else if (this.catchAllHandler) {
                var instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
                    params: { path: fragment },
                    queryParams: urlRecognizationResults ? urlRecognizationResults.queryParams : {},
                    config: null // config will be created by the catchAllHandler
                }));
                result = evaluateNavigationStrategy(instruction, this.catchAllHandler);
            }
            else if (this.parent) {
                var router = this._parentCatchAllHandler(this.parent);
                if (router) {
                    var newParentInstruction = this._findParentInstructionFromRouter(router, parentInstruction);
                    var instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
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
            return result || Promise.reject(new Error("Route not found: " + url));
        };
        /**@internal */
        Router.prototype._findParentInstructionFromRouter = function (router, instruction) {
            if (instruction.router === router) {
                instruction.fragment = router.baseUrl; // need to change the fragment in case of a redirect instead of moduleId
                return instruction;
            }
            else if (instruction.parentInstruction) {
                return this._findParentInstructionFromRouter(router, instruction.parentInstruction);
            }
            return undefined;
        };
        /**@internal */
        Router.prototype._parentCatchAllHandler = function (router) {
            if (router.catchAllHandler) {
                return router;
            }
            else if (router.parent) {
                return this._parentCatchAllHandler(router.parent);
            }
            return false;
        };
        /**
         * @internal
         */
        Router.prototype._createRouteConfig = function (config, instruction) {
            var _this = this;
            return Promise
                .resolve(config)
                .then(function (c) {
                if (typeof c === 'string') {
                    return { moduleId: c };
                }
                else if (typeof c === 'function') {
                    return c(instruction);
                }
                return c;
            })
                // typing here could be either RouteConfig or RedirectConfig
                // but temporarily treat both as RouteConfig
                // todo: improve typings precision
                .then(function (c) { return typeof c === 'string' ? { moduleId: c } : c; })
                .then(function (c) {
                c.route = instruction.params.path;
                validateRouteConfig(c);
                if (!c.navModel) {
                    c.navModel = _this.createNavModel(c);
                }
                return c;
            });
        };
        return Router;
    }());
    /* @internal exported for unit testing */
    var generateBaseUrl = function (router, instruction) {
        return "" + (router.baseUrl || '') + (instruction.getBaseUrl() || '');
    };
    /* @internal exported for unit testing */
    var validateRouteConfig = function (config) {
        if (typeof config !== 'object') {
            throw new Error('Invalid Route Config');
        }
        if (typeof config.route !== 'string') {
            var name_1 = config.name || '(no name)';
            throw new Error('Invalid Route Config for "' + name_1 + '": You must specify a "route:" pattern.');
        }
        if (!('redirect' in config || config.moduleId || config.navigationStrategy || config.viewPorts)) {
            throw new Error('Invalid Route Config for "' + config.route + '": You must specify a "moduleId:", "redirect:", "navigationStrategy:", or "viewPorts:".');
        }
    };
    /* @internal exported for unit testing */
    var evaluateNavigationStrategy = function (instruction, evaluator, context) {
        return Promise
            .resolve(evaluator.call(context, instruction))
            .then(function () {
            if (!('viewPorts' in instruction.config)) {
                instruction.config.viewPorts = {
                    'default': {
                        moduleId: instruction.config.moduleId
                    }
                };
            }
            return instruction;
        });
    };

    /**@internal exported for unit testing */
    var createNextFn = function (instruction, steps) {
        var index = -1;
        var next = function () {
            index++;
            if (index < steps.length) {
                var currentStep = steps[index];
                try {
                    return currentStep(instruction, next);
                }
                catch (e) {
                    return next.reject(e);
                }
            }
            else {
                return next.complete();
            }
        };
        next.complete = createCompletionHandler(next, "completed" /* Completed */);
        next.cancel = createCompletionHandler(next, "canceled" /* Canceled */);
        next.reject = createCompletionHandler(next, "rejected" /* Rejected */);
        return next;
    };
    /**@internal exported for unit testing */
    var createCompletionHandler = function (next, status) {
        return function (output) { return Promise
            .resolve({
            status: status,
            output: output,
            completed: status === "completed" /* Completed */
        }); };
    };

    /**
     * The class responsible for managing and processing the navigation pipeline.
     */
    var Pipeline = /** @class */ (function () {
        function Pipeline() {
            /**
             * The pipeline steps. And steps added via addStep will be converted to a function
             * The actualy running functions with correct step contexts of this pipeline
             */
            this.steps = [];
        }
        /**
         * Adds a step to the pipeline.
         *
         * @param step The pipeline step.
         */
        Pipeline.prototype.addStep = function (step) {
            var run;
            if (typeof step === 'function') {
                run = step;
            }
            else if (typeof step.getSteps === 'function') {
                // getSteps is to enable support open slots
                // where devs can add multiple steps into the same slot name
                var steps = step.getSteps();
                for (var i = 0, l = steps.length; i < l; i++) {
                    this.addStep(steps[i]);
                }
                return this;
            }
            else {
                run = step.run.bind(step);
            }
            this.steps.push(run);
            return this;
        };
        /**
         * Runs the pipeline.
         *
         * @param instruction The navigation instruction to process.
         */
        Pipeline.prototype.run = function (instruction) {
            var nextFn = createNextFn(instruction, this.steps);
            return nextFn();
        };
        return Pipeline;
    }());

    /**
    * Determines if the provided object is a navigation command.
    * A navigation command is anything with a navigate method.
    *
    * @param obj The object to check.
    */
    function isNavigationCommand(obj) {
        return obj && typeof obj.navigate === 'function';
    }
    /**
    * Used during the activation lifecycle to cause a redirect.
    */
    var Redirect = /** @class */ (function () {
        /**
         * @param url The URL fragment to use as the navigation destination.
         * @param options The navigation options.
         */
        function Redirect(url, options) {
            if (options === void 0) { options = {}; }
            this.url = url;
            this.options = Object.assign({ trigger: true, replace: true }, options);
            this.shouldContinueProcessing = false;
        }
        /**
         * Called by the activation system to set the child router.
         *
         * @param router The router.
         */
        Redirect.prototype.setRouter = function (router) {
            this.router = router;
        };
        /**
         * Called by the navigation pipeline to navigate.
         *
         * @param appRouter The router to be redirected.
         */
        Redirect.prototype.navigate = function (appRouter) {
            var navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
            navigatingRouter.navigate(this.url, this.options);
        };
        return Redirect;
    }());
    /**
     * Used during the activation lifecycle to cause a redirect to a named route.
     */
    var RedirectToRoute = /** @class */ (function () {
        /**
         * @param route The name of the route.
         * @param params The parameters to be sent to the activation method.
         * @param options The options to use for navigation.
         */
        function RedirectToRoute(route, params, options) {
            if (params === void 0) { params = {}; }
            if (options === void 0) { options = {}; }
            this.route = route;
            this.params = params;
            this.options = Object.assign({ trigger: true, replace: true }, options);
            this.shouldContinueProcessing = false;
        }
        /**
         * Called by the activation system to set the child router.
         *
         * @param router The router.
         */
        RedirectToRoute.prototype.setRouter = function (router) {
            this.router = router;
        };
        /**
         * Called by the navigation pipeline to navigate.
         *
         * @param appRouter The router to be redirected.
         */
        RedirectToRoute.prototype.navigate = function (appRouter) {
            var navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
            navigatingRouter.navigateToRoute(this.route, this.params, this.options);
        };
        return RedirectToRoute;
    }());

    /**
     * @internal exported for unit testing
     */
    function _buildNavigationPlan(instruction, forceLifecycleMinimum) {
        var config = instruction.config;
        if ('redirect' in config) {
            return buildRedirectPlan(instruction);
        }
        var prevInstruction = instruction.previousInstruction;
        var defaultViewPortConfigs = instruction.router.viewPortDefaults;
        if (prevInstruction) {
            return buildTransitionPlans(instruction, prevInstruction, defaultViewPortConfigs, forceLifecycleMinimum);
        }
        // first navigation, only need to prepare a few information for each viewport plan
        var viewPortPlans = {};
        var viewPortConfigs = config.viewPorts;
        for (var viewPortName in viewPortConfigs) {
            var viewPortConfig = viewPortConfigs[viewPortName];
            if (viewPortConfig.moduleId === null && viewPortName in defaultViewPortConfigs) {
                viewPortConfig = defaultViewPortConfigs[viewPortName];
            }
            viewPortPlans[viewPortName] = {
                name: viewPortName,
                strategy: "replace" /* Replace */,
                config: viewPortConfig
            };
        }
        return Promise.resolve(viewPortPlans);
    }
    /**
     * Build redirect plan based on config of a navigation instruction
     * @internal exported for unit testing
     */
    var buildRedirectPlan = function (instruction) {
        var config = instruction.config;
        var router = instruction.router;
        return router
            ._createNavigationInstruction(config.redirect)
            .then(function (redirectInstruction) {
            var params = {};
            var originalInstructionParams = instruction.params;
            var redirectInstructionParams = redirectInstruction.params;
            for (var key in redirectInstructionParams) {
                // If the param on the redirect points to another param, e.g. { route: first/:this, redirect: second/:this }
                var val = redirectInstructionParams[key];
                if (typeof val === 'string' && val[0] === ':') {
                    val = val.slice(1);
                    // And if that param is found on the original instruction then use it
                    if (val in originalInstructionParams) {
                        params[key] = originalInstructionParams[val];
                    }
                }
                else {
                    params[key] = redirectInstructionParams[key];
                }
            }
            var redirectLocation = router.generate(redirectInstruction.config, params, instruction.options);
            // Special handling for child routes
            for (var key in originalInstructionParams) {
                redirectLocation = redirectLocation.replace(":" + key, originalInstructionParams[key]);
            }
            var queryString = instruction.queryString;
            if (queryString) {
                redirectLocation += '?' + queryString;
            }
            return Promise.resolve(new Redirect(redirectLocation));
        });
    };
    /**
     * @param viewPortPlans the Plan record that holds information about built plans
     * @internal exported for unit testing
     */
    var buildTransitionPlans = function (currentInstruction, previousInstruction, defaultViewPortConfigs, forceLifecycleMinimum) {
        var viewPortPlans = {};
        var newInstructionConfig = currentInstruction.config;
        var hasNewParams = hasDifferentParameterValues(previousInstruction, currentInstruction);
        var pending = [];
        var previousViewPortInstructions = previousInstruction.viewPortInstructions;
        var _loop_1 = function (viewPortName) {
            var prevViewPortInstruction = previousViewPortInstructions[viewPortName];
            var prevViewPortComponent = prevViewPortInstruction.component;
            var newInstructionViewPortConfigs = newInstructionConfig.viewPorts;
            // if this is invoked on a viewport without any changes, based on new url,
            // newViewPortConfig will be the existing viewport instruction
            var nextViewPortConfig = viewPortName in newInstructionViewPortConfigs
                ? newInstructionViewPortConfigs[viewPortName]
                : prevViewPortInstruction;
            if (nextViewPortConfig.moduleId === null && viewPortName in defaultViewPortConfigs) {
                nextViewPortConfig = defaultViewPortConfigs[viewPortName];
            }
            var viewPortActivationStrategy = determineActivationStrategy(currentInstruction, prevViewPortInstruction, nextViewPortConfig, hasNewParams, forceLifecycleMinimum);
            var viewPortPlan = viewPortPlans[viewPortName] = {
                name: viewPortName,
                // ViewPortInstruction can quack like a RouteConfig
                config: nextViewPortConfig,
                prevComponent: prevViewPortComponent,
                prevModuleId: prevViewPortInstruction.moduleId,
                strategy: viewPortActivationStrategy
            };
            // recursively build nav plans for all existing child routers/viewports of this viewport
            // this is possible because existing child viewports and routers already have necessary information
            // to process the wildcard path from parent instruction
            if (viewPortActivationStrategy !== "replace" /* Replace */ && prevViewPortInstruction.childRouter) {
                var path = currentInstruction.getWildcardPath();
                var task = prevViewPortInstruction
                    .childRouter
                    ._createNavigationInstruction(path, currentInstruction)
                    .then(function (childInstruction) {
                    viewPortPlan.childNavigationInstruction = childInstruction;
                    return _buildNavigationPlan(childInstruction, 
                    // is it safe to assume viewPortPlan has not been changed from previous assignment?
                    // if so, can just use local variable viewPortPlanStrategy
                    // there could be user code modifying viewport plan during _createNavigationInstruction?
                    viewPortPlan.strategy === "invoke-lifecycle" /* InvokeLifecycle */)
                        .then(function (childPlan) {
                        if (childPlan instanceof Redirect) {
                            return Promise.reject(childPlan);
                        }
                        childInstruction.plan = childPlan;
                        // for bluebird ?
                        return null;
                    });
                });
                pending.push(task);
            }
        };
        for (var viewPortName in previousViewPortInstructions) {
            _loop_1(viewPortName);
        }
        return Promise.all(pending).then(function () { return viewPortPlans; });
    };
    /**
     * @param newViewPortConfig if this is invoked on a viewport without any changes, based on new url, newViewPortConfig will be the existing viewport instruction
     * @internal exported for unit testing
     */
    var determineActivationStrategy = function (currentNavInstruction, prevViewPortInstruction, newViewPortConfig, 
    // indicates whether there is difference between old and new url params
    hasNewParams, forceLifecycleMinimum) {
        var newInstructionConfig = currentNavInstruction.config;
        var prevViewPortViewModel = prevViewPortInstruction.component.viewModel;
        var viewPortPlanStrategy;
        if (prevViewPortInstruction.moduleId !== newViewPortConfig.moduleId) {
            viewPortPlanStrategy = "replace" /* Replace */;
        }
        else if ('determineActivationStrategy' in prevViewPortViewModel) {
            viewPortPlanStrategy = prevViewPortViewModel.determineActivationStrategy.apply(prevViewPortViewModel, currentNavInstruction.lifecycleArgs);
        }
        else if (newInstructionConfig.activationStrategy) {
            viewPortPlanStrategy = newInstructionConfig.activationStrategy;
        }
        else if (hasNewParams || forceLifecycleMinimum) {
            viewPortPlanStrategy = "invoke-lifecycle" /* InvokeLifecycle */;
        }
        else {
            viewPortPlanStrategy = "no-change" /* NoChange */;
        }
        return viewPortPlanStrategy;
    };
    /**@internal exported for unit testing */
    var hasDifferentParameterValues = function (prev, next) {
        var prevParams = prev.params;
        var nextParams = next.params;
        var nextWildCardName = next.config.hasChildRouter ? next.getWildCardName() : null;
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
        if (!next.options.compareQueryParams) {
            return false;
        }
        var prevQueryParams = prev.queryParams;
        var nextQueryParams = next.queryParams;
        for (var key in nextQueryParams) {
            if (prevQueryParams[key] !== nextQueryParams[key]) {
                return true;
            }
        }
        for (var key in prevQueryParams) {
            if (prevQueryParams[key] !== nextQueryParams[key]) {
                return true;
            }
        }
        return false;
    };

    /**
     * Transform a navigation instruction into viewport plan record object,
     * or a redirect request if user viewmodel demands
     */
    var BuildNavigationPlanStep = /** @class */ (function () {
        function BuildNavigationPlanStep() {
        }
        BuildNavigationPlanStep.prototype.run = function (navigationInstruction, next) {
            return _buildNavigationPlan(navigationInstruction)
                .then(function (plan) {
                if (plan instanceof Redirect) {
                    return next.cancel(plan);
                }
                navigationInstruction.plan = plan;
                return next();
            })
                .catch(next.cancel);
        };
        return BuildNavigationPlanStep;
    }());

    /**
     * @internal Exported for unit testing
     */
    var loadNewRoute = function (routeLoader, navigationInstruction) {
        var loadingPlans = determineLoadingPlans(navigationInstruction);
        var loadPromises = loadingPlans.map(function (loadingPlan) { return loadRoute(routeLoader, loadingPlan.navigationInstruction, loadingPlan.viewPortPlan); });
        return Promise.all(loadPromises);
    };
    /**
     * @internal Exported for unit testing
     */
    var determineLoadingPlans = function (navigationInstruction, loadingPlans) {
        if (loadingPlans === void 0) { loadingPlans = []; }
        var viewPortPlans = navigationInstruction.plan;
        for (var viewPortName in viewPortPlans) {
            var viewPortPlan = viewPortPlans[viewPortName];
            var childNavInstruction = viewPortPlan.childNavigationInstruction;
            if (viewPortPlan.strategy === "replace" /* Replace */) {
                loadingPlans.push({ viewPortPlan: viewPortPlan, navigationInstruction: navigationInstruction });
                if (childNavInstruction) {
                    determineLoadingPlans(childNavInstruction, loadingPlans);
                }
            }
            else {
                var viewPortInstruction = navigationInstruction.addViewPortInstruction({
                    name: viewPortName,
                    strategy: viewPortPlan.strategy,
                    moduleId: viewPortPlan.prevModuleId,
                    component: viewPortPlan.prevComponent
                });
                if (childNavInstruction) {
                    viewPortInstruction.childNavigationInstruction = childNavInstruction;
                    determineLoadingPlans(childNavInstruction, loadingPlans);
                }
            }
        }
        return loadingPlans;
    };
    /**
     * @internal Exported for unit testing
     */
    var loadRoute = function (routeLoader, navigationInstruction, viewPortPlan) {
        var planConfig = viewPortPlan.config;
        var moduleId = planConfig ? planConfig.moduleId : null;
        return loadComponent(routeLoader, navigationInstruction, planConfig)
            .then(function (component) {
            var viewPortInstruction = navigationInstruction.addViewPortInstruction({
                name: viewPortPlan.name,
                strategy: viewPortPlan.strategy,
                moduleId: moduleId,
                component: component
            });
            var childRouter = component.childRouter;
            if (childRouter) {
                var path = navigationInstruction.getWildcardPath();
                return childRouter
                    ._createNavigationInstruction(path, navigationInstruction)
                    .then(function (childInstruction) {
                    viewPortPlan.childNavigationInstruction = childInstruction;
                    return _buildNavigationPlan(childInstruction)
                        .then(function (childPlan) {
                        if (childPlan instanceof Redirect) {
                            return Promise.reject(childPlan);
                        }
                        childInstruction.plan = childPlan;
                        viewPortInstruction.childNavigationInstruction = childInstruction;
                        return loadNewRoute(routeLoader, childInstruction);
                    });
                });
            }
            // ts complains without this, though they are same
            return void 0;
        });
    };
    /**
     * Load a routed-component based on navigation instruction and route config
     * @internal exported for unit testing only
     */
    var loadComponent = function (routeLoader, navigationInstruction, config) {
        var router = navigationInstruction.router;
        var lifecycleArgs = navigationInstruction.lifecycleArgs;
        return Promise.resolve()
            .then(function () { return routeLoader.loadRoute(router, config, navigationInstruction); })
            .then(
        /**
         * @param component an object carrying information about loaded route
         * typically contains information about view model, childContainer, view and router
         */
        function (component) {
            var viewModel = component.viewModel, childContainer = component.childContainer;
            component.router = router;
            component.config = config;
            if ('configureRouter' in viewModel) {
                var childRouter_1 = childContainer.getChildRouter();
                component.childRouter = childRouter_1;
                return childRouter_1
                    .configure(function (c) { return viewModel.configureRouter(c, childRouter_1, lifecycleArgs[0], lifecycleArgs[1], lifecycleArgs[2]); })
                    .then(function () { return component; });
            }
            return component;
        });
    };

    /**
     * Abstract class that is responsible for loading view / view model from a route config
     * The default implementation can be found in `aurelia-templating-router`
     */
    var RouteLoader = /** @class */ (function () {
        function RouteLoader() {
        }
        /**
         * Load a route config based on its viewmodel / view configuration
         */
        // return typing: return typings used to be never
        // as it was a throw. Changing it to Promise<any> should not cause any issues
        RouteLoader.prototype.loadRoute = function (router, config, navigationInstruction) {
            throw new Error('Route loaders must implement "loadRoute(router, config, navigationInstruction)".');
        };
        return RouteLoader;
    }());

    /**
     * A pipeline step responsible for loading a route config of a navigation instruction
     */
    var LoadRouteStep = /** @class */ (function () {
        function LoadRouteStep(routeLoader) {
            this.routeLoader = routeLoader;
        }
        /**@internal */
        LoadRouteStep.inject = function () { return [RouteLoader]; };
        /**
         * Run the internal to load route config of a navigation instruction to prepare for next steps in the pipeline
         */
        LoadRouteStep.prototype.run = function (navigationInstruction, next) {
            return loadNewRoute(this.routeLoader, navigationInstruction)
                .then(next, next.cancel);
        };
        return LoadRouteStep;
    }());

    /**
     * A pipeline step for instructing a piepline to commit changes on a navigation instruction
     */
    var CommitChangesStep = /** @class */ (function () {
        function CommitChangesStep() {
        }
        CommitChangesStep.prototype.run = function (navigationInstruction, next) {
            return navigationInstruction
                ._commitChanges(/*wait to swap?*/ true)
                .then(function () {
                navigationInstruction._updateTitle();
                return next();
            });
        };
        return CommitChangesStep;
    }());

    /**
     * An optional interface describing the available activation strategies.
     * @internal Used internally.
     */
    var InternalActivationStrategy;
    (function (InternalActivationStrategy) {
        /**
         * Reuse the existing view model, without invoking Router lifecycle hooks.
         */
        InternalActivationStrategy["NoChange"] = "no-change";
        /**
         * Reuse the existing view model, invoking Router lifecycle hooks.
         */
        InternalActivationStrategy["InvokeLifecycle"] = "invoke-lifecycle";
        /**
         * Replace the existing view model, invoking Router lifecycle hooks.
         */
        InternalActivationStrategy["Replace"] = "replace";
    })(InternalActivationStrategy || (InternalActivationStrategy = {}));
    /**
     * The strategy to use when activating modules during navigation.
     */
    // kept for compat reason
    var activationStrategy = {
        noChange: "no-change" /* NoChange */,
        invokeLifecycle: "invoke-lifecycle" /* InvokeLifecycle */,
        replace: "replace" /* Replace */
    };

    /**
     * Recursively find list of deactivate-able view models
     * and invoke the either 'canDeactivate' or 'deactivate' on each
     * @internal exported for unit testing
     */
    var processDeactivatable = function (navigationInstruction, callbackName, next, ignoreResult) {
        var plan = navigationInstruction.plan;
        var infos = findDeactivatable(plan, callbackName);
        var i = infos.length; // query from inside out
        function inspect(val) {
            if (ignoreResult || shouldContinue(val)) {
                return iterate();
            }
            return next.cancel(val);
        }
        function iterate() {
            if (i--) {
                try {
                    var viewModel = infos[i];
                    var result = viewModel[callbackName](navigationInstruction);
                    return processPotential(result, inspect, next.cancel);
                }
                catch (error) {
                    return next.cancel(error);
                }
            }
            navigationInstruction.router.couldDeactivate = true;
            return next();
        }
        return iterate();
    };
    /**
     * Recursively find and returns a list of deactivate-able view models
     * @internal exported for unit testing
     */
    var findDeactivatable = function (plan, callbackName, list) {
        if (list === void 0) { list = []; }
        for (var viewPortName in plan) {
            var viewPortPlan = plan[viewPortName];
            var prevComponent = viewPortPlan.prevComponent;
            if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle || viewPortPlan.strategy === activationStrategy.replace)
                && prevComponent) {
                var viewModel = prevComponent.viewModel;
                if (callbackName in viewModel) {
                    list.push(viewModel);
                }
            }
            if (viewPortPlan.strategy === activationStrategy.replace && prevComponent) {
                addPreviousDeactivatable(prevComponent, callbackName, list);
            }
            else if (viewPortPlan.childNavigationInstruction) {
                findDeactivatable(viewPortPlan.childNavigationInstruction.plan, callbackName, list);
            }
        }
        return list;
    };
    /**
     * @internal exported for unit testing
     */
    var addPreviousDeactivatable = function (component, callbackName, list) {
        var childRouter = component.childRouter;
        if (childRouter && childRouter.currentInstruction) {
            var viewPortInstructions = childRouter.currentInstruction.viewPortInstructions;
            for (var viewPortName in viewPortInstructions) {
                var viewPortInstruction = viewPortInstructions[viewPortName];
                var prevComponent = viewPortInstruction.component;
                var prevViewModel = prevComponent.viewModel;
                if (callbackName in prevViewModel) {
                    list.push(prevViewModel);
                }
                addPreviousDeactivatable(prevComponent, callbackName, list);
            }
        }
    };
    /**
     * @internal exported for unit testing
     */
    var processActivatable = function (navigationInstruction, callbackName, next, ignoreResult) {
        var infos = findActivatable(navigationInstruction, callbackName);
        var length = infos.length;
        var i = -1; // query from top down
        function inspect(val, router) {
            if (ignoreResult || shouldContinue(val, router)) {
                return iterate();
            }
            return next.cancel(val);
        }
        function iterate() {
            var _a;
            i++;
            if (i < length) {
                try {
                    var current_1 = infos[i];
                    var result = (_a = current_1.viewModel)[callbackName].apply(_a, current_1.lifecycleArgs);
                    return processPotential(result, function (val) { return inspect(val, current_1.router); }, next.cancel);
                }
                catch (error) {
                    return next.cancel(error);
                }
            }
            return next();
        }
        return iterate();
    };
    /**
     * Find list of activatable view model and add to list (3rd parameter)
     * @internal exported for unit testing
     */
    var findActivatable = function (navigationInstruction, callbackName, list, router) {
        if (list === void 0) { list = []; }
        var plan = navigationInstruction.plan;
        Object
            .keys(plan)
            .forEach(function (viewPortName) {
            var viewPortPlan = plan[viewPortName];
            var viewPortInstruction = navigationInstruction.viewPortInstructions[viewPortName];
            var viewPortComponent = viewPortInstruction.component;
            var viewModel = viewPortComponent.viewModel;
            if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle
                || viewPortPlan.strategy === activationStrategy.replace)
                && callbackName in viewModel) {
                list.push({
                    viewModel: viewModel,
                    lifecycleArgs: viewPortInstruction.lifecycleArgs,
                    router: router
                });
            }
            var childNavInstruction = viewPortPlan.childNavigationInstruction;
            if (childNavInstruction) {
                findActivatable(childNavInstruction, callbackName, list, viewPortComponent.childRouter || router);
            }
        });
        return list;
    };
    var shouldContinue = function (output, router) {
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
    };
    /**
     * wraps a subscription, allowing unsubscribe calls even if
     * the first value comes synchronously
     */
    var SafeSubscription = /** @class */ (function () {
        function SafeSubscription(subscriptionFunc) {
            this._subscribed = true;
            this._subscription = subscriptionFunc(this);
            if (!this._subscribed) {
                this.unsubscribe();
            }
        }
        Object.defineProperty(SafeSubscription.prototype, "subscribed", {
            get: function () {
                return this._subscribed;
            },
            enumerable: true,
            configurable: true
        });
        SafeSubscription.prototype.unsubscribe = function () {
            if (this._subscribed && this._subscription) {
                this._subscription.unsubscribe();
            }
            this._subscribed = false;
        };
        return SafeSubscription;
    }());
    /**
     * A function to process return value from `activate`/`canActivate` steps
     * Supports observable/promise
     *
     * For observable, resolve at first next() or on complete()
     */
    var processPotential = function (obj, resolve, reject) {
        // if promise like
        if (obj && typeof obj.then === 'function') {
            return Promise.resolve(obj).then(resolve).catch(reject);
        }
        // if observable
        if (obj && typeof obj.subscribe === 'function') {
            var obs_1 = obj;
            return new SafeSubscription(function (sub) { return obs_1.subscribe({
                next: function () {
                    if (sub.subscribed) {
                        sub.unsubscribe();
                        resolve(obj);
                    }
                },
                error: function (error) {
                    if (sub.subscribed) {
                        sub.unsubscribe();
                        reject(error);
                    }
                },
                complete: function () {
                    if (sub.subscribed) {
                        sub.unsubscribe();
                        resolve(obj);
                    }
                }
            }); });
        }
        // else just resolve
        try {
            return resolve(obj);
        }
        catch (error) {
            return reject(error);
        }
    };

    /**
     * A pipeline step responsible for finding and activating method `canDeactivate` on a view model of a route
     */
    var CanDeactivatePreviousStep = /** @class */ (function () {
        function CanDeactivatePreviousStep() {
        }
        CanDeactivatePreviousStep.prototype.run = function (navigationInstruction, next) {
            return processDeactivatable(navigationInstruction, 'canDeactivate', next);
        };
        return CanDeactivatePreviousStep;
    }());
    /**
     * A pipeline step responsible for finding and activating method `canActivate` on a view model of a route
     */
    var CanActivateNextStep = /** @class */ (function () {
        function CanActivateNextStep() {
        }
        CanActivateNextStep.prototype.run = function (navigationInstruction, next) {
            return processActivatable(navigationInstruction, 'canActivate', next);
        };
        return CanActivateNextStep;
    }());
    /**
     * A pipeline step responsible for finding and activating method `deactivate` on a view model of a route
     */
    var DeactivatePreviousStep = /** @class */ (function () {
        function DeactivatePreviousStep() {
        }
        DeactivatePreviousStep.prototype.run = function (navigationInstruction, next) {
            return processDeactivatable(navigationInstruction, 'deactivate', next, true);
        };
        return DeactivatePreviousStep;
    }());
    /**
     * A pipeline step responsible for finding and activating method `activate` on a view model of a route
     */
    var ActivateNextStep = /** @class */ (function () {
        function ActivateNextStep() {
        }
        ActivateNextStep.prototype.run = function (navigationInstruction, next) {
            return processActivatable(navigationInstruction, 'activate', next, true);
        };
        return ActivateNextStep;
    }());

    /**
     * A multi-slots Pipeline Placeholder Step for hooking into a pipeline execution
     */
    var PipelineSlot = /** @class */ (function () {
        function PipelineSlot(container, name, alias) {
            this.steps = [];
            this.container = container;
            this.slotName = name;
            this.slotAlias = alias;
        }
        PipelineSlot.prototype.getSteps = function () {
            var _this = this;
            return this.steps.map(function (x) { return _this.container.get(x); });
        };
        return PipelineSlot;
    }());
    /**
     * Class responsible for creating the navigation pipeline.
     */
    var PipelineProvider = /** @class */ (function () {
        function PipelineProvider(container) {
            this.container = container;
            this.steps = [
                BuildNavigationPlanStep,
                CanDeactivatePreviousStep,
                LoadRouteStep,
                createPipelineSlot(container, "authorize" /* Authorize */),
                CanActivateNextStep,
                createPipelineSlot(container, "preActivate" /* PreActivate */, 'modelbind'),
                // NOTE: app state changes start below - point of no return
                DeactivatePreviousStep,
                ActivateNextStep,
                createPipelineSlot(container, "preRender" /* PreRender */, 'precommit'),
                CommitChangesStep,
                createPipelineSlot(container, "postRender" /* PostRender */, 'postcomplete')
            ];
        }
        /**@internal */
        PipelineProvider.inject = function () { return [aureliaDependencyInjection.Container]; };
        /**
         * Create the navigation pipeline.
         */
        PipelineProvider.prototype.createPipeline = function (useCanDeactivateStep) {
            var _this = this;
            if (useCanDeactivateStep === void 0) { useCanDeactivateStep = true; }
            var pipeline = new Pipeline();
            this.steps.forEach(function (step) {
                if (useCanDeactivateStep || step !== CanDeactivatePreviousStep) {
                    pipeline.addStep(_this.container.get(step));
                }
            });
            return pipeline;
        };
        /**@internal */
        PipelineProvider.prototype._findStep = function (name) {
            // Steps that are not PipelineSlots are constructor functions, and they will automatically fail. Probably.
            return this.steps.find(function (x) { return x.slotName === name || x.slotAlias === name; });
        };
        /**
         * Adds a step into the pipeline at a known slot location.
         */
        PipelineProvider.prototype.addStep = function (name, step) {
            var found = this._findStep(name);
            if (found) {
                var slotSteps = found.steps;
                // prevent duplicates
                if (!slotSteps.includes(step)) {
                    slotSteps.push(step);
                }
            }
            else {
                throw new Error("Invalid pipeline slot name: " + name + ".");
            }
        };
        /**
         * Removes a step from a slot in the pipeline
         */
        PipelineProvider.prototype.removeStep = function (name, step) {
            var slot = this._findStep(name);
            if (slot) {
                var slotSteps = slot.steps;
                slotSteps.splice(slotSteps.indexOf(step), 1);
            }
        };
        /**
         * Clears all steps from a slot in the pipeline
         * @internal
         */
        PipelineProvider.prototype._clearSteps = function (name) {
            if (name === void 0) { name = ''; }
            var slot = this._findStep(name);
            if (slot) {
                slot.steps = [];
            }
        };
        /**
         * Resets all pipeline slots
         */
        PipelineProvider.prototype.reset = function () {
            this._clearSteps("authorize" /* Authorize */);
            this._clearSteps("preActivate" /* PreActivate */);
            this._clearSteps("preRender" /* PreRender */);
            this._clearSteps("postRender" /* PostRender */);
        };
        return PipelineProvider;
    }());
    /**@internal */
    var createPipelineSlot = function (container, name, alias) {
        return new PipelineSlot(container, name, alias);
    };

    var logger = LogManager.getLogger('app-router');
    /**
     * The main application router.
     */
    var AppRouter = /** @class */ (function (_super) {
        __extends(AppRouter, _super);
        function AppRouter(container, history, pipelineProvider, events) {
            var _this = _super.call(this, container, history) || this;
            _this.pipelineProvider = pipelineProvider;
            _this.events = events;
            return _this;
        }
        /**@internal */
        AppRouter.inject = function () { return [aureliaDependencyInjection.Container, aureliaHistory.History, PipelineProvider, aureliaEventAggregator.EventAggregator]; };
        /**
         * Fully resets the router's internal state. Primarily used internally by the framework when multiple calls to setRoot are made.
         * Use with caution (actually, avoid using this). Do not use this to simply change your navigation model.
         */
        AppRouter.prototype.reset = function () {
            _super.prototype.reset.call(this);
            this.maxInstructionCount = 10;
            if (!this._queue) {
                this._queue = [];
            }
            else {
                this._queue.length = 0;
            }
        };
        /**
         * Loads the specified URL.
         *
         * @param url The URL fragment to load.
         */
        AppRouter.prototype.loadUrl = function (url) {
            var _this = this;
            return this
                ._createNavigationInstruction(url)
                .then(function (instruction) { return _this._queueInstruction(instruction); })
                .catch(function (error) {
                logger.error(error);
                restorePreviousLocation(_this);
            });
        };
        /**
         * Registers a viewPort to be used as a rendering target for activated routes.
         *
         * @param viewPort The viewPort. This is typically a <router-view/> element in Aurelia default impl
         * @param name The name of the viewPort. 'default' if unspecified.
         */
        AppRouter.prototype.registerViewPort = function (viewPort, name) {
            var _this = this;
            // having strong typing without changing public API
            var $viewPort = viewPort;
            _super.prototype.registerViewPort.call(this, $viewPort, name);
            // beside adding viewport to the registry of this instance
            // AppRouter also configure routing/history to start routing functionality
            // There are situation where there are more than 1 <router-view/> element at root view
            // in that case, still only activate once via the following guard
            if (!this.isActive) {
                var viewModel_1 = this._findViewModel($viewPort);
                if ('configureRouter' in viewModel_1) {
                    // If there are more than one <router-view/> element at root view
                    // use this flag to guard against configure method being invoked multiple times
                    // this flag is set inside method configure
                    if (!this.isConfigured) {
                        // replace the real resolve with a noop to guarantee that any action in base class Router
                        // won't resolve the configurePromise prematurely
                        var resolveConfiguredPromise_1 = this._resolveConfiguredPromise;
                        this._resolveConfiguredPromise = function () { };
                        return this
                            .configure(function (config) {
                            return Promise
                                .resolve(viewModel_1.configureRouter(config, _this))
                                // an issue with configure interface. Should be fixed there
                                // todo: fix this via configure interface in router
                                .then(function () { return config; });
                        })
                            .then(function () {
                            _this.activate();
                            resolveConfiguredPromise_1();
                        });
                    }
                }
                else {
                    this.activate();
                }
            }
            // when a viewport is added dynamically to a root view that is already activated
            // just process the navigation instruction
            else {
                this._dequeueInstruction();
            }
            return Promise.resolve();
        };
        /**
         * Activates the router. This instructs the router to begin listening for history changes and processing instructions.
         *
         * @params options The set of options to activate the router with.
         */
        AppRouter.prototype.activate = function (options) {
            if (this.isActive) {
                return;
            }
            this.isActive = true;
            // route handler property is responsible for handling url change
            // the interface of aurelia-history isn't clear on this perspective
            this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
            this.history.activate(this.options);
            this._dequeueInstruction();
        };
        /**
         * Deactivates the router.
         */
        AppRouter.prototype.deactivate = function () {
            this.isActive = false;
            this.history.deactivate();
        };
        /**@internal */
        AppRouter.prototype._queueInstruction = function (instruction) {
            var _this = this;
            return new Promise(function (resolve) {
                instruction.resolve = resolve;
                _this._queue.unshift(instruction);
                _this._dequeueInstruction();
            });
        };
        /**@internal */
        AppRouter.prototype._dequeueInstruction = function (instructionCount) {
            var _this = this;
            if (instructionCount === void 0) { instructionCount = 0; }
            return Promise.resolve().then(function () {
                if (_this.isNavigating && !instructionCount) {
                    // ts complains about inconsistent returns without void 0
                    return void 0;
                }
                var instruction = _this._queue.shift();
                _this._queue.length = 0;
                if (!instruction) {
                    // ts complains about inconsistent returns without void 0
                    return void 0;
                }
                _this.isNavigating = true;
                var navtracker = _this.history.getState('NavigationTracker');
                var currentNavTracker = _this.currentNavigationTracker;
                if (!navtracker && !currentNavTracker) {
                    _this.isNavigatingFirst = true;
                    _this.isNavigatingNew = true;
                }
                else if (!navtracker) {
                    _this.isNavigatingNew = true;
                }
                else if (!currentNavTracker) {
                    _this.isNavigatingRefresh = true;
                }
                else if (currentNavTracker < navtracker) {
                    _this.isNavigatingForward = true;
                }
                else if (currentNavTracker > navtracker) {
                    _this.isNavigatingBack = true;
                }
                if (!navtracker) {
                    navtracker = Date.now();
                    _this.history.setState('NavigationTracker', navtracker);
                }
                _this.currentNavigationTracker = navtracker;
                instruction.previousInstruction = _this.currentInstruction;
                var maxInstructionCount = _this.maxInstructionCount;
                if (!instructionCount) {
                    _this.events.publish("router:navigation:processing" /* Processing */, { instruction: instruction });
                }
                else if (instructionCount === maxInstructionCount - 1) {
                    logger.error(instructionCount + 1 + " navigation instructions have been attempted without success. Restoring last known good location.");
                    restorePreviousLocation(_this);
                    return _this._dequeueInstruction(instructionCount + 1);
                }
                else if (instructionCount > maxInstructionCount) {
                    throw new Error('Maximum navigation attempts exceeded. Giving up.');
                }
                var pipeline = _this.pipelineProvider.createPipeline(!_this.couldDeactivate);
                return pipeline
                    .run(instruction)
                    .then(function (result) { return processResult(instruction, result, instructionCount, _this); })
                    .catch(function (error) {
                    return { output: error instanceof Error ? error : new Error(error) };
                })
                    .then(function (result) { return resolveInstruction(instruction, result, !!instructionCount, _this); });
            });
        };
        /**@internal */
        AppRouter.prototype._findViewModel = function (viewPort) {
            if (this.container.viewModel) {
                return this.container.viewModel;
            }
            if (viewPort.container) {
                var container = viewPort.container;
                while (container) {
                    if (container.viewModel) {
                        this.container.viewModel = container.viewModel;
                        return container.viewModel;
                    }
                    container = container.parent;
                }
            }
            return undefined;
        };
        return AppRouter;
    }(Router));
    var processResult = function (instruction, result, instructionCount, router) {
        if (!(result && 'completed' in result && 'output' in result)) {
            result = result || {};
            result.output = new Error("Expected router pipeline to return a navigation result, but got [" + JSON.stringify(result) + "] instead.");
        }
        var finalResult = null;
        var navigationCommandResult = null;
        if (isNavigationCommand(result.output)) {
            navigationCommandResult = result.output.navigate(router);
        }
        else {
            finalResult = result;
            if (!result.completed) {
                if (result.output instanceof Error) {
                    logger.error(result.output.toString());
                }
                restorePreviousLocation(router);
            }
        }
        return Promise.resolve(navigationCommandResult)
            .then(function (_) { return router._dequeueInstruction(instructionCount + 1); })
            .then(function (innerResult) { return finalResult || innerResult || result; });
    };
    var resolveInstruction = function (instruction, result, isInnerInstruction, router) {
        instruction.resolve(result);
        var eventAggregator = router.events;
        var eventArgs = { instruction: instruction, result: result };
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
            var eventName = void 0;
            if (result.output instanceof Error) {
                eventName = "router:navigation:error" /* Error */;
            }
            else if (!result.completed) {
                eventName = "router:navigation:canceled" /* Canceled */;
            }
            else {
                var queryString = instruction.queryString ? ('?' + instruction.queryString) : '';
                router.history.previousLocation = instruction.fragment + queryString;
                eventName = "router:navigation:success" /* Success */;
            }
            eventAggregator.publish(eventName, eventArgs);
            eventAggregator.publish("router:navigation:complete" /* Complete */, eventArgs);
        }
        else {
            eventAggregator.publish("router:navigation:child:complete" /* ChildComplete */, eventArgs);
        }
        return result;
    };
    var restorePreviousLocation = function (router) {
        var previousLocation = router.history.previousLocation;
        if (previousLocation) {
            router.navigate(previousLocation, { trigger: false, replace: true });
        }
        else if (router.fallbackRoute) {
            router.navigate(router.fallbackRoute, { trigger: true, replace: true });
        }
        else {
            logger.error('Router navigation failed, and no previous location or fallbackRoute could be restored.');
        }
    };

    /**
    * The status of a Pipeline.
    */
    (function (PipelineStatus) {
        PipelineStatus["Completed"] = "completed";
        PipelineStatus["Canceled"] = "canceled";
        PipelineStatus["Rejected"] = "rejected";
        PipelineStatus["Running"] = "running";
    })(exports.PipelineStatus || (exports.PipelineStatus = {}));

    /**
     * A list of known router events used by the Aurelia router
     * to signal the pipeline has come to a certain state
     */
    (function (RouterEvent) {
        RouterEvent["Processing"] = "router:navigation:processing";
        RouterEvent["Error"] = "router:navigation:error";
        RouterEvent["Canceled"] = "router:navigation:canceled";
        RouterEvent["Complete"] = "router:navigation:complete";
        RouterEvent["Success"] = "router:navigation:success";
        RouterEvent["ChildComplete"] = "router:navigation:child:complete";
    })(exports.RouterEvent || (exports.RouterEvent = {}));

    /**
     * Available pipeline slot names to insert interceptor into router pipeline
     */
    (function (PipelineSlotName) {
        /**
         * Authorization slot. Invoked early in the pipeline,
         * before `canActivate` hook of incoming route
         */
        PipelineSlotName["Authorize"] = "authorize";
        /**
         * Pre-activation slot. Invoked early in the pipeline,
         * Invoked timing:
         *   - after Authorization slot
         *   - after canActivate hook on new view model
         *   - before deactivate hook on old view model
         *   - before activate hook on new view model
         */
        PipelineSlotName["PreActivate"] = "preActivate";
        /**
         * Pre-render slot. Invoked later in the pipeline
         * Invokcation timing:
         *   - after activate hook on new view model
         *   - before commit step on new navigation instruction
         */
        PipelineSlotName["PreRender"] = "preRender";
        /**
         * Post-render slot. Invoked last in the pipeline
         */
        PipelineSlotName["PostRender"] = "postRender";
    })(exports.PipelineSlotName || (exports.PipelineSlotName = {}));

    exports.ActivateNextStep = ActivateNextStep;
    exports.AppRouter = AppRouter;
    exports.BuildNavigationPlanStep = BuildNavigationPlanStep;
    exports.CanActivateNextStep = CanActivateNextStep;
    exports.CanDeactivatePreviousStep = CanDeactivatePreviousStep;
    exports.CommitChangesStep = CommitChangesStep;
    exports.DeactivatePreviousStep = DeactivatePreviousStep;
    exports.LoadRouteStep = LoadRouteStep;
    exports.NavModel = NavModel;
    exports.NavigationInstruction = NavigationInstruction;
    exports.Pipeline = Pipeline;
    exports.PipelineProvider = PipelineProvider;
    exports.Redirect = Redirect;
    exports.RedirectToRoute = RedirectToRoute;
    exports.RouteLoader = RouteLoader;
    exports.Router = Router;
    exports.RouterConfiguration = RouterConfiguration;
    exports.activationStrategy = activationStrategy;
    exports.isNavigationCommand = isNavigationCommand;

    Object.defineProperty(exports, '__esModule', { value: true });

});
//# sourceMappingURL=aurelia-router.js.map
