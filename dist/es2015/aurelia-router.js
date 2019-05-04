import { getLogger } from 'aurelia-logging';
import { Container } from 'aurelia-dependency-injection';
import { History } from 'aurelia-history';
import { RouteRecognizer } from 'aurelia-route-recognizer';
import { EventAggregator } from 'aurelia-event-aggregator';

/**
 * Class used to represent an instruction during a navigation.
 */
class NavigationInstruction {
    constructor(init) {
        /**
         * Current built viewport plan of this nav instruction
         */
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
                // remove the param for the injected child route segment
                delete currentParams[current.getWildCardName()];
            }
            ancestorParams.unshift(currentParams);
            current = current.parentInstruction;
        } while (current);
        let allParams = Object.assign({}, this.queryParams, ...ancestorParams);
        this.lifecycleArgs = [allParams, this.config, this];
    }
    /**
     * Gets an array containing this instruction and all child instructions for the current navigation.
     */
    getAllInstructions() {
        let instructions = [this];
        let viewPortInstructions = this.viewPortInstructions;
        for (let key in viewPortInstructions) {
            let childInstruction = viewPortInstructions[key].childNavigationInstruction;
            if (childInstruction) {
                instructions.push(...childInstruction.getAllInstructions());
            }
        }
        return instructions;
    }
    /**
     * Gets an array containing the instruction and all child instructions for the previous navigation.
     * Previous instructions are no longer available after navigation completes.
     */
    getAllPreviousInstructions() {
        return this.getAllInstructions().map(c => c.previousInstruction).filter(c => c);
    }
    addViewPortInstruction(nameOrInitOptions, strategy, moduleId, component) {
        let viewPortInstruction;
        let viewPortName = typeof nameOrInitOptions === 'string' ? nameOrInitOptions : nameOrInitOptions.name;
        const lifecycleArgs = this.lifecycleArgs;
        const config = Object.assign({}, lifecycleArgs[1], { currentViewPort: viewPortName });
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
    }
    /**
     * Gets the name of the route pattern's wildcard parameter, if applicable.
     */
    getWildCardName() {
        // todo: potential issue, or at least unsafe typings
        let configRoute = this.config.route;
        let wildcardIndex = configRoute.lastIndexOf('*');
        return configRoute.substr(wildcardIndex + 1);
    }
    /**
     * Gets the path and query string created by filling the route
     * pattern's wildcard parameter with the matching param.
     */
    getWildcardPath() {
        let wildcardName = this.getWildCardName();
        let path = this.params[wildcardName] || '';
        let queryString = this.queryString;
        if (queryString) {
            path += '?' + queryString;
        }
        return path;
    }
    /**
     * Gets the instruction's base URL, accounting for wildcard route parameters.
     */
    getBaseUrl() {
        let $encodeURI = encodeURI;
        let fragment = decodeURI(this.fragment);
        if (fragment === '') {
            let nonEmptyRoute = this.router.routes.find(route => {
                return route.name === this.config.name &&
                    route.route !== '';
            });
            if (nonEmptyRoute) {
                fragment = nonEmptyRoute.route;
            }
        }
        if (!this.params) {
            return $encodeURI(fragment);
        }
        let wildcardName = this.getWildCardName();
        let path = this.params[wildcardName] || '';
        if (!path) {
            return $encodeURI(fragment);
        }
        return $encodeURI(fragment.substr(0, fragment.lastIndexOf(path)));
    }
    /**
     * Finalize a viewport instruction
     * @internal
     */
    _commitChanges(waitToSwap) {
        let router = this.router;
        router.currentInstruction = this;
        const previousInstruction = this.previousInstruction;
        if (previousInstruction) {
            previousInstruction.config.navModel.isActive = false;
        }
        this.config.navModel.isActive = true;
        router.refreshNavigation();
        let loads = [];
        let delaySwaps = [];
        let viewPortInstructions = this.viewPortInstructions;
        for (let viewPortName in viewPortInstructions) {
            let viewPortInstruction = viewPortInstructions[viewPortName];
            let viewPort = router.viewPorts[viewPortName];
            if (!viewPort) {
                throw new Error(`There was no router-view found in the view for ${viewPortInstruction.moduleId}.`);
            }
            let childNavInstruction = viewPortInstruction.childNavigationInstruction;
            if (viewPortInstruction.strategy === "replace" /* Replace */) {
                if (childNavInstruction && childNavInstruction.parentCatchHandler) {
                    loads.push(childNavInstruction._commitChanges(waitToSwap));
                }
                else {
                    if (waitToSwap) {
                        delaySwaps.push({ viewPort, viewPortInstruction });
                    }
                    loads.push(viewPort
                        .process(viewPortInstruction, waitToSwap)
                        .then(() => childNavInstruction
                        ? childNavInstruction._commitChanges(waitToSwap)
                        : Promise.resolve()));
                }
            }
            else {
                if (childNavInstruction) {
                    loads.push(childNavInstruction._commitChanges(waitToSwap));
                }
            }
        }
        return Promise
            .all(loads)
            .then(() => {
            delaySwaps.forEach(x => x.viewPort.swap(x.viewPortInstruction));
            return null;
        })
            .then(() => prune(this));
    }
    /**@internal */
    _updateTitle() {
        let router = this.router;
        let title = this._buildTitle(router.titleSeparator);
        if (title) {
            router.history.setTitle(title);
        }
    }
    /**@internal */
    _buildTitle(separator = ' | ') {
        let title = '';
        let childTitles = [];
        let navModelTitle = this.config.navModel.title;
        let instructionRouter = this.router;
        let viewPortInstructions = this.viewPortInstructions;
        if (navModelTitle) {
            title = instructionRouter.transformTitle(navModelTitle);
        }
        for (let viewPortName in viewPortInstructions) {
            let viewPortInstruction = viewPortInstructions[viewPortName];
            let child_nav_instruction = viewPortInstruction.childNavigationInstruction;
            if (child_nav_instruction) {
                let childTitle = child_nav_instruction._buildTitle(separator);
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
    }
}
const prune = (instruction) => {
    instruction.previousInstruction = null;
    instruction.plan = null;
};

/**
* Class for storing and interacting with a route's navigation settings.
*/
class NavModel {
    constructor(router, relativeHref) {
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
    setTitle(title) {
        this.title = title;
        if (this.isActive) {
            this.router.updateTitle();
        }
    }
}

function _normalizeAbsolutePath(path, hasPushState, absolute = false) {
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
function _resolveUrl(fragment, baseUrl, hasPushState) {
    if (isRootedPath.test(fragment)) {
        return _normalizeAbsolutePath(fragment, hasPushState);
    }
    return _createRootedPath(fragment, baseUrl, hasPushState);
}
function _ensureArrayWithSingleRoutePerConfig(config) {
    let routeConfigs = [];
    if (Array.isArray(config.route)) {
        for (let i = 0, ii = config.route.length; i < ii; ++i) {
            let current = Object.assign({}, config);
            current.route = config.route[i];
            routeConfigs.push(current);
        }
    }
    else {
        routeConfigs.push(Object.assign({}, config));
    }
    return routeConfigs;
}
const isRootedPath = /^#?\//;
const isAbsoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;

/**
 * Class used to configure a [[Router]] instance.
 *
 * @constructor
 */
class RouterConfiguration {
    constructor() {
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
    addPipelineStep(name, step) {
        if (step === null || step === undefined) {
            throw new Error('Pipeline step cannot be null or undefined.');
        }
        this.pipelineSteps.push({ name, step });
        return this;
    }
    /**
     * Adds a step to be run during the [[Router]]'s authorize pipeline slot.
     *
     * @param step The pipeline step.
     * @chainable
     */
    addAuthorizeStep(step) {
        return this.addPipelineStep("authorize" /* Authorize */, step);
    }
    /**
     * Adds a step to be run during the [[Router]]'s preActivate pipeline slot.
     *
     * @param step The pipeline step.
     * @chainable
     */
    addPreActivateStep(step) {
        return this.addPipelineStep("preActivate" /* PreActivate */, step);
    }
    /**
     * Adds a step to be run during the [[Router]]'s preRender pipeline slot.
     *
     * @param step The pipeline step.
     * @chainable
     */
    addPreRenderStep(step) {
        return this.addPipelineStep("preRender" /* PreRender */, step);
    }
    /**
     * Adds a step to be run during the [[Router]]'s postRender pipeline slot.
     *
     * @param step The pipeline step.
     * @chainable
     */
    addPostRenderStep(step) {
        return this.addPipelineStep("postRender" /* PostRender */, step);
    }
    /**
     * Configures a route that will be used if there is no previous location available on navigation cancellation.
     *
     * @param fragment The URL fragment to use as the navigation destination.
     * @chainable
     */
    fallbackRoute(fragment) {
        this._fallbackRoute = fragment;
        return this;
    }
    /**
     * Maps one or more routes to be registered with the router.
     *
     * @param route The [[RouteConfig]] to map, or an array of [[RouteConfig]] to map.
     * @chainable
     */
    map(route) {
        if (Array.isArray(route)) {
            route.forEach(r => this.map(r));
            return this;
        }
        return this.mapRoute(route);
    }
    /**
     * Configures defaults to use for any view ports.
     *
     * @param viewPortConfig a view port configuration object to use as a
     *  default, of the form { viewPortName: { moduleId } }.
     * @chainable
     */
    useViewPortDefaults(viewPortConfig) {
        this.viewPortDefaults = viewPortConfig;
        return this;
    }
    /**
     * Maps a single route to be registered with the router.
     *
     * @param route The [[RouteConfig]] to map.
     * @chainable
     */
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
    /**
     * Registers an unknown route handler to be run when the URL fragment doesn't match any registered routes.
     *
     * @param config A string containing a moduleId to load, or a [[RouteConfig]], or a function that takes the
     *  [[NavigationInstruction]] and selects a moduleId to load.
     * @chainable
     */
    mapUnknownRoutes(config) {
        this.unknownRouteConfig = config;
        return this;
    }
    /**
     * Applies the current configuration to the specified [[Router]].
     *
     * @param router The [[Router]] to apply the configuration to.
     */
    exportToRouter(router) {
        let instructions = this.instructions;
        for (let i = 0, ii = instructions.length; i < ii; ++i) {
            instructions[i](router);
        }
        let { title, titleSeparator, unknownRouteConfig, _fallbackRoute, viewPortDefaults } = this;
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
        let pipelineSteps = this.pipelineSteps;
        let pipelineStepCount = pipelineSteps.length;
        if (pipelineStepCount) {
            if (!router.isRoot) {
                throw new Error('Pipeline steps can only be added to the root router');
            }
            let pipelineProvider = router.pipelineProvider;
            for (let i = 0, ii = pipelineStepCount; i < ii; ++i) {
                let { name, step } = pipelineSteps[i];
                pipelineProvider.addStep(name, step);
            }
        }
    }
}

/**
 * The primary class responsible for handling routing and navigation.
 */
class Router {
    /**
     * @param container The [[Container]] to use when child routers.
     * @param history The [[History]] implementation to delegate navigation requests to.
     */
    constructor(container, history) {
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
        this.transformTitle = (title) => {
            if (this.parent) {
                return this.parent.transformTitle(title);
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
    get isRoot() {
        return !this.parent;
    }
    /**
     * Registers a viewPort to be used as a rendering target for activated routes.
     *
     * @param viewPort The viewPort.
     * @param name The name of the viewPort. 'default' if unspecified.
     */
    registerViewPort(viewPort, name) {
        name = name || 'default';
        this.viewPorts[name] = viewPort;
    }
    /**
     * Returns a Promise that resolves when the router is configured.
     */
    ensureConfigured() {
        return this._configuredPromise;
    }
    /**
     * Configures the router.
     *
     * @param callbackOrConfig The [[RouterConfiguration]] or a callback that takes a [[RouterConfiguration]].
     */
    configure(callbackOrConfig) {
        this.isConfigured = true;
        let result = callbackOrConfig;
        let config;
        if (typeof callbackOrConfig === 'function') {
            config = new RouterConfiguration();
            result = callbackOrConfig(config);
        }
        return Promise
            .resolve(result)
            .then((c) => {
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
    navigate(fragment, options) {
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
    navigateToRoute(route, params, options) {
        let path = this.generate(route, params);
        return this.navigate(path, options);
    }
    /**
     * Navigates back to the most recent location in history.
     */
    navigateBack() {
        this.isExplicitNavigationBack = true;
        this.history.navigateBack();
    }
    /**
     * Creates a child router of the current router.
     *
     * @param container The [[Container]] to provide to the child router. Uses the current [[Router]]'s [[Container]] if unspecified.
     * @returns {Router} The new child Router.
     */
    createChild(container) {
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
    generate(nameOrRoute, params = {}, options = {}) {
        // A child recognizer generates routes for potential child routes. Any potential child route is added
        // to the childRoute property of params for the childRouter to recognize. When generating routes, we
        // use the childRecognizer when childRoute params are available to generate a child router enabled route.
        let recognizer = 'childRoute' in params ? this._childRecognizer : this._recognizer;
        let hasRoute = recognizer.hasRoute(nameOrRoute);
        if (!hasRoute) {
            if (this.parent) {
                return this.parent.generate(nameOrRoute, params, options);
            }
            throw new Error(`A route with name '${nameOrRoute}' could not be found. Check that \`name: '${nameOrRoute}'\` was specified in the route's config.`);
        }
        let path = recognizer.generate(nameOrRoute, params);
        let rootedPath = _createRootedPath(path, this.baseUrl, this.history._hasPushState, options.absolute);
        return options.absolute ? `${this.history.getAbsoluteRoot()}${rootedPath}` : rootedPath;
    }
    /**
     * Creates a [[NavModel]] for the specified route config.
     *
     * @param config The route config.
     */
    createNavModel(config) {
        let navModel = new NavModel(this, 'href' in config
            ? config.href
            // potential error when config.route is a string[] ?
            : config.route);
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
    addRoute(config, navModel) {
        if (Array.isArray(config.route)) {
            let routeConfigs = _ensureArrayWithSingleRoutePerConfig(config);
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
        let path = config.route;
        if (path.charAt(0) === '/') {
            path = path.substr(1);
        }
        let caseSensitive = config.caseSensitive === true;
        let state = this._recognizer.add({
            path: path,
            handler: config,
            caseSensitive: caseSensitive
        });
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
        let navigation = this.navigation;
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
            navigation.sort((a, b) => a.order - b.order);
        }
    }
    /**
     * Gets a value indicating whether or not this [[Router]] or one of its ancestors has a route registered with the specified name.
     *
     * @param name The name of the route to check.
     */
    hasRoute(name) {
        return !!(this._recognizer.hasRoute(name) || this.parent && this.parent.hasRoute(name));
    }
    /**
     * Gets a value indicating whether or not this [[Router]] has a route registered with the specified name.
     *
     * @param name The name of the route to check.
     */
    hasOwnRoute(name) {
        return this._recognizer.hasRoute(name);
    }
    /**
     * Register a handler to use when the incoming URL fragment doesn't match any registered routes.
     *
     * @param config The moduleId, or a function that selects the moduleId, or a [[RouteConfig]].
     */
    handleUnknownRoutes(config) {
        if (!config) {
            throw new Error('Invalid unknown route handler');
        }
        this.catchAllHandler = instruction => {
            return this
                ._createRouteConfig(config, instruction)
                .then(c => {
                instruction.config = c;
                return instruction;
            });
        };
    }
    /**
     * Updates the document title using the current navigation instruction.
     */
    updateTitle() {
        let parentRouter = this.parent;
        if (parentRouter) {
            return parentRouter.updateTitle();
        }
        let currentInstruction = this.currentInstruction;
        if (currentInstruction) {
            currentInstruction._updateTitle();
        }
        return undefined;
    }
    /**
     * Updates the navigation routes with hrefs relative to the current location.
     * Note: This method will likely move to a plugin in a future release.
     */
    refreshNavigation() {
        let nav = this.navigation;
        for (let i = 0, length = nav.length; i < length; i++) {
            let current = nav[i];
            if (!current.config.href) {
                current.href = _createRootedPath(current.relativeHref, this.baseUrl, this.history._hasPushState);
            }
            else {
                current.href = _normalizeAbsolutePath(current.config.href, this.history._hasPushState);
            }
        }
    }
    /**
     * Sets the default configuration for the view ports. This specifies how to
     *  populate a view port for which no module is specified. The default is
     *  an empty view/view-model pair.
     */
    useViewPortDefaults($viewPortDefaults) {
        // a workaround to have strong typings while not requiring to expose interface ViewPortInstruction
        let viewPortDefaults = $viewPortDefaults;
        for (let viewPortName in viewPortDefaults) {
            let viewPortConfig = viewPortDefaults[viewPortName];
            this.viewPortDefaults[viewPortName] = {
                moduleId: viewPortConfig.moduleId
            };
        }
    }
    /**@internal */
    _refreshBaseUrl() {
        let parentRouter = this.parent;
        if (parentRouter) {
            this.baseUrl = generateBaseUrl(parentRouter, parentRouter.currentInstruction);
        }
    }
    /**@internal */
    _createNavigationInstruction(url = '', parentInstruction = null) {
        let fragment = url;
        let queryString = '';
        let queryIndex = url.indexOf('?');
        if (queryIndex !== -1) {
            fragment = url.substr(0, queryIndex);
            queryString = url.substr(queryIndex + 1);
        }
        let urlRecognizationResults = this._recognizer.recognize(url);
        if (!urlRecognizationResults || !urlRecognizationResults.length) {
            urlRecognizationResults = this._childRecognizer.recognize(url);
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
        if (urlRecognizationResults && urlRecognizationResults.length) {
            let first = urlRecognizationResults[0];
            let instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
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
            let instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
                params: { path: fragment },
                queryParams: urlRecognizationResults ? urlRecognizationResults.queryParams : {},
                config: null // config will be created by the catchAllHandler
            }));
            result = evaluateNavigationStrategy(instruction, this.catchAllHandler);
        }
        else if (this.parent) {
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
    _findParentInstructionFromRouter(router, instruction) {
        if (instruction.router === router) {
            instruction.fragment = router.baseUrl; // need to change the fragment in case of a redirect instead of moduleId
            return instruction;
        }
        else if (instruction.parentInstruction) {
            return this._findParentInstructionFromRouter(router, instruction.parentInstruction);
        }
        return undefined;
    }
    /**@internal */
    _parentCatchAllHandler(router) {
        if (router.catchAllHandler) {
            return router;
        }
        else if (router.parent) {
            return this._parentCatchAllHandler(router.parent);
        }
        return false;
    }
    /**
     * @internal
     */
    _createRouteConfig(config, instruction) {
        return Promise
            .resolve(config)
            .then((c) => {
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
            .then((c) => typeof c === 'string' ? { moduleId: c } : c)
            .then((c) => {
            c.route = instruction.params.path;
            validateRouteConfig(c);
            if (!c.navModel) {
                c.navModel = this.createNavModel(c);
            }
            return c;
        });
    }
}
/* @internal exported for unit testing */
const generateBaseUrl = (router, instruction) => {
    return `${router.baseUrl || ''}${instruction.getBaseUrl() || ''}`;
};
/* @internal exported for unit testing */
const validateRouteConfig = (config) => {
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
};
/* @internal exported for unit testing */
const evaluateNavigationStrategy = (instruction, evaluator, context) => {
    return Promise
        .resolve(evaluator.call(context, instruction))
        .then(() => {
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
const createNextFn = (instruction, steps) => {
    let index = -1;
    const next = function () {
        index++;
        if (index < steps.length) {
            let currentStep = steps[index];
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
const createCompletionHandler = (next, status) => {
    return (output) => Promise
        .resolve({
        status,
        output,
        completed: status === "completed" /* Completed */
    });
};

/**
 * The class responsible for managing and processing the navigation pipeline.
 */
class Pipeline {
    constructor() {
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
    addStep(step) {
        let run;
        if (typeof step === 'function') {
            run = step;
        }
        else if (typeof step.getSteps === 'function') {
            // getSteps is to enable support open slots
            // where devs can add multiple steps into the same slot name
            let steps = step.getSteps();
            for (let i = 0, l = steps.length; i < l; i++) {
                this.addStep(steps[i]);
            }
            return this;
        }
        else {
            run = step.run.bind(step);
        }
        this.steps.push(run);
        return this;
    }
    /**
     * Runs the pipeline.
     *
     * @param instruction The navigation instruction to process.
     */
    run(instruction) {
        const nextFn = createNextFn(instruction, this.steps);
        return nextFn();
    }
}

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
class Redirect {
    /**
     * @param url The URL fragment to use as the navigation destination.
     * @param options The navigation options.
     */
    constructor(url, options = {}) {
        this.url = url;
        this.options = Object.assign({ trigger: true, replace: true }, options);
        this.shouldContinueProcessing = false;
    }
    /**
     * Called by the activation system to set the child router.
     *
     * @param router The router.
     */
    setRouter(router) {
        this.router = router;
    }
    /**
     * Called by the navigation pipeline to navigate.
     *
     * @param appRouter The router to be redirected.
     */
    navigate(appRouter) {
        let navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
        navigatingRouter.navigate(this.url, this.options);
    }
}
/**
 * Used during the activation lifecycle to cause a redirect to a named route.
 */
class RedirectToRoute {
    /**
     * @param route The name of the route.
     * @param params The parameters to be sent to the activation method.
     * @param options The options to use for navigation.
     */
    constructor(route, params = {}, options = {}) {
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
    setRouter(router) {
        this.router = router;
    }
    /**
     * Called by the navigation pipeline to navigate.
     *
     * @param appRouter The router to be redirected.
     */
    navigate(appRouter) {
        let navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
        navigatingRouter.navigateToRoute(this.route, this.params, this.options);
    }
}

/**
 * @internal exported for unit testing
 */
function _buildNavigationPlan(instruction, forceLifecycleMinimum) {
    let config = instruction.config;
    if ('redirect' in config) {
        return buildRedirectPlan(instruction);
    }
    const prevInstruction = instruction.previousInstruction;
    const defaultViewPortConfigs = instruction.router.viewPortDefaults;
    if (prevInstruction) {
        return buildTransitionPlans(instruction, prevInstruction, defaultViewPortConfigs, forceLifecycleMinimum);
    }
    // first navigation, only need to prepare a few information for each viewport plan
    const viewPortPlans = {};
    let viewPortConfigs = config.viewPorts;
    for (let viewPortName in viewPortConfigs) {
        let viewPortConfig = viewPortConfigs[viewPortName];
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
const buildRedirectPlan = (instruction) => {
    const config = instruction.config;
    const router = instruction.router;
    return router
        ._createNavigationInstruction(config.redirect)
        .then(redirectInstruction => {
        const params = {};
        const originalInstructionParams = instruction.params;
        const redirectInstructionParams = redirectInstruction.params;
        for (let key in redirectInstructionParams) {
            // If the param on the redirect points to another param, e.g. { route: first/:this, redirect: second/:this }
            let val = redirectInstructionParams[key];
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
        let redirectLocation = router.generate(redirectInstruction.config, params, instruction.options);
        // Special handling for child routes
        for (let key in originalInstructionParams) {
            redirectLocation = redirectLocation.replace(`:${key}`, originalInstructionParams[key]);
        }
        let queryString = instruction.queryString;
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
const buildTransitionPlans = (currentInstruction, previousInstruction, defaultViewPortConfigs, forceLifecycleMinimum) => {
    let viewPortPlans = {};
    let newInstructionConfig = currentInstruction.config;
    let hasNewParams = hasDifferentParameterValues(previousInstruction, currentInstruction);
    let pending = [];
    let previousViewPortInstructions = previousInstruction.viewPortInstructions;
    for (let viewPortName in previousViewPortInstructions) {
        const prevViewPortInstruction = previousViewPortInstructions[viewPortName];
        const prevViewPortComponent = prevViewPortInstruction.component;
        const newInstructionViewPortConfigs = newInstructionConfig.viewPorts;
        // if this is invoked on a viewport without any changes, based on new url,
        // newViewPortConfig will be the existing viewport instruction
        let nextViewPortConfig = viewPortName in newInstructionViewPortConfigs
            ? newInstructionViewPortConfigs[viewPortName]
            : prevViewPortInstruction;
        if (nextViewPortConfig.moduleId === null && viewPortName in defaultViewPortConfigs) {
            nextViewPortConfig = defaultViewPortConfigs[viewPortName];
        }
        const viewPortActivationStrategy = determineActivationStrategy(currentInstruction, prevViewPortInstruction, nextViewPortConfig, hasNewParams, forceLifecycleMinimum);
        const viewPortPlan = viewPortPlans[viewPortName] = {
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
            const path = currentInstruction.getWildcardPath();
            const task = prevViewPortInstruction
                .childRouter
                ._createNavigationInstruction(path, currentInstruction)
                .then((childInstruction) => {
                viewPortPlan.childNavigationInstruction = childInstruction;
                return _buildNavigationPlan(childInstruction, 
                // is it safe to assume viewPortPlan has not been changed from previous assignment?
                // if so, can just use local variable viewPortPlanStrategy
                // there could be user code modifying viewport plan during _createNavigationInstruction?
                viewPortPlan.strategy === "invoke-lifecycle" /* InvokeLifecycle */)
                    .then(childPlan => {
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
    }
    return Promise.all(pending).then(() => viewPortPlans);
};
/**
 * @param newViewPortConfig if this is invoked on a viewport without any changes, based on new url, newViewPortConfig will be the existing viewport instruction
 * @internal exported for unit testing
 */
const determineActivationStrategy = (currentNavInstruction, prevViewPortInstruction, newViewPortConfig, 
// indicates whether there is difference between old and new url params
hasNewParams, forceLifecycleMinimum) => {
    let newInstructionConfig = currentNavInstruction.config;
    let prevViewPortViewModel = prevViewPortInstruction.component.viewModel;
    let viewPortPlanStrategy;
    if (prevViewPortInstruction.moduleId !== newViewPortConfig.moduleId) {
        viewPortPlanStrategy = "replace" /* Replace */;
    }
    else if ('determineActivationStrategy' in prevViewPortViewModel) {
        viewPortPlanStrategy = prevViewPortViewModel.determineActivationStrategy(...currentNavInstruction.lifecycleArgs);
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
const hasDifferentParameterValues = (prev, next) => {
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
};

/**
 * Transform a navigation instruction into viewport plan record object,
 * or a redirect request if user viewmodel demands
 */
class BuildNavigationPlanStep {
    run(navigationInstruction, next) {
        return _buildNavigationPlan(navigationInstruction)
            .then(plan => {
            if (plan instanceof Redirect) {
                return next.cancel(plan);
            }
            navigationInstruction.plan = plan;
            return next();
        })
            .catch(next.cancel);
    }
}

/**
 * @internal Exported for unit testing
 */
const loadNewRoute = (routeLoader, navigationInstruction) => {
    let loadingPlans = determineLoadingPlans(navigationInstruction);
    let loadPromises = loadingPlans.map((loadingPlan) => loadRoute(routeLoader, loadingPlan.navigationInstruction, loadingPlan.viewPortPlan));
    return Promise.all(loadPromises);
};
/**
 * @internal Exported for unit testing
 */
const determineLoadingPlans = (navigationInstruction, loadingPlans = []) => {
    let viewPortPlans = navigationInstruction.plan;
    for (let viewPortName in viewPortPlans) {
        let viewPortPlan = viewPortPlans[viewPortName];
        let childNavInstruction = viewPortPlan.childNavigationInstruction;
        if (viewPortPlan.strategy === "replace" /* Replace */) {
            loadingPlans.push({ viewPortPlan, navigationInstruction });
            if (childNavInstruction) {
                determineLoadingPlans(childNavInstruction, loadingPlans);
            }
        }
        else {
            let viewPortInstruction = navigationInstruction.addViewPortInstruction({
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
const loadRoute = (routeLoader, navigationInstruction, viewPortPlan) => {
    let planConfig = viewPortPlan.config;
    let moduleId = planConfig ? planConfig.moduleId : null;
    return loadComponent(routeLoader, navigationInstruction, planConfig)
        .then((component) => {
        let viewPortInstruction = navigationInstruction.addViewPortInstruction({
            name: viewPortPlan.name,
            strategy: viewPortPlan.strategy,
            moduleId: moduleId,
            component: component
        });
        let childRouter = component.childRouter;
        if (childRouter) {
            let path = navigationInstruction.getWildcardPath();
            return childRouter
                ._createNavigationInstruction(path, navigationInstruction)
                .then((childInstruction) => {
                viewPortPlan.childNavigationInstruction = childInstruction;
                return _buildNavigationPlan(childInstruction)
                    .then((childPlan) => {
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
const loadComponent = (routeLoader, navigationInstruction, config) => {
    let router = navigationInstruction.router;
    let lifecycleArgs = navigationInstruction.lifecycleArgs;
    return Promise.resolve()
        .then(() => routeLoader.loadRoute(router, config, navigationInstruction))
        .then(
    /**
     * @param component an object carrying information about loaded route
     * typically contains information about view model, childContainer, view and router
     */
    (component) => {
        let { viewModel, childContainer } = component;
        component.router = router;
        component.config = config;
        if ('configureRouter' in viewModel) {
            let childRouter = childContainer.getChildRouter();
            component.childRouter = childRouter;
            return childRouter
                .configure(c => viewModel.configureRouter(c, childRouter, lifecycleArgs[0], lifecycleArgs[1], lifecycleArgs[2]))
                .then(() => component);
        }
        return component;
    });
};

/**
 * Abstract class that is responsible for loading view / view model from a route config
 * The default implementation can be found in `aurelia-templating-router`
 */
class RouteLoader {
    /**
     * Load a route config based on its viewmodel / view configuration
     */
    // return typing: return typings used to be never
    // as it was a throw. Changing it to Promise<any> should not cause any issues
    loadRoute(router, config, navigationInstruction) {
        throw new Error('Route loaders must implement "loadRoute(router, config, navigationInstruction)".');
    }
}

/**
 * A pipeline step responsible for loading a route config of a navigation instruction
 */
class LoadRouteStep {
    /**@internal */
    static inject() { return [RouteLoader]; }
    constructor(routeLoader) {
        this.routeLoader = routeLoader;
    }
    /**
     * Run the internal to load route config of a navigation instruction to prepare for next steps in the pipeline
     */
    run(navigationInstruction, next) {
        return loadNewRoute(this.routeLoader, navigationInstruction)
            .then(next, next.cancel);
    }
}

/**
 * A pipeline step for instructing a piepline to commit changes on a navigation instruction
 */
class CommitChangesStep {
    run(navigationInstruction, next) {
        return navigationInstruction
            ._commitChanges(/*wait to swap?*/ true)
            .then(() => {
            navigationInstruction._updateTitle();
            return next();
        });
    }
}

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
const activationStrategy = {
    noChange: "no-change" /* NoChange */,
    invokeLifecycle: "invoke-lifecycle" /* InvokeLifecycle */,
    replace: "replace" /* Replace */
};

/**
 * Recursively find list of deactivate-able view models
 * and invoke the either 'canDeactivate' or 'deactivate' on each
 * @internal exported for unit testing
 */
const processDeactivatable = (navigationInstruction, callbackName, next, ignoreResult) => {
    let plan = navigationInstruction.plan;
    let infos = findDeactivatable(plan, callbackName);
    let i = infos.length; // query from inside out
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
const findDeactivatable = (plan, callbackName, list = []) => {
    for (let viewPortName in plan) {
        let viewPortPlan = plan[viewPortName];
        let prevComponent = viewPortPlan.prevComponent;
        if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle || viewPortPlan.strategy === activationStrategy.replace)
            && prevComponent) {
            let viewModel = prevComponent.viewModel;
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
const addPreviousDeactivatable = (component, callbackName, list) => {
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
};
/**
 * @internal exported for unit testing
 */
const processActivatable = (navigationInstruction, callbackName, next, ignoreResult) => {
    let infos = findActivatable(navigationInstruction, callbackName);
    let length = infos.length;
    let i = -1; // query from top down
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
                return processPotential(result, (val) => inspect(val, current.router), next.cancel);
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
const findActivatable = (navigationInstruction, callbackName, list = [], router) => {
    let plan = navigationInstruction.plan;
    Object
        .keys(plan)
        .forEach((viewPortName) => {
        let viewPortPlan = plan[viewPortName];
        let viewPortInstruction = navigationInstruction.viewPortInstructions[viewPortName];
        let viewPortComponent = viewPortInstruction.component;
        let viewModel = viewPortComponent.viewModel;
        if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle
            || viewPortPlan.strategy === activationStrategy.replace)
            && callbackName in viewModel) {
            list.push({
                viewModel,
                lifecycleArgs: viewPortInstruction.lifecycleArgs,
                router
            });
        }
        let childNavInstruction = viewPortPlan.childNavigationInstruction;
        if (childNavInstruction) {
            findActivatable(childNavInstruction, callbackName, list, viewPortComponent.childRouter || router);
        }
    });
    return list;
};
const shouldContinue = (output, router) => {
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
class SafeSubscription {
    constructor(subscriptionFunc) {
        this._subscribed = true;
        this._subscription = subscriptionFunc(this);
        if (!this._subscribed) {
            this.unsubscribe();
        }
    }
    get subscribed() {
        return this._subscribed;
    }
    unsubscribe() {
        if (this._subscribed && this._subscription) {
            this._subscription.unsubscribe();
        }
        this._subscribed = false;
    }
}
/**
 * A function to process return value from `activate`/`canActivate` steps
 * Supports observable/promise
 *
 * For observable, resolve at first next() or on complete()
 */
const processPotential = (obj, resolve, reject) => {
    // if promise like
    if (obj && typeof obj.then === 'function') {
        return Promise.resolve(obj).then(resolve).catch(reject);
    }
    // if observable
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
class CanDeactivatePreviousStep {
    run(navigationInstruction, next) {
        return processDeactivatable(navigationInstruction, 'canDeactivate', next);
    }
}
/**
 * A pipeline step responsible for finding and activating method `canActivate` on a view model of a route
 */
class CanActivateNextStep {
    run(navigationInstruction, next) {
        return processActivatable(navigationInstruction, 'canActivate', next);
    }
}
/**
 * A pipeline step responsible for finding and activating method `deactivate` on a view model of a route
 */
class DeactivatePreviousStep {
    run(navigationInstruction, next) {
        return processDeactivatable(navigationInstruction, 'deactivate', next, true);
    }
}
/**
 * A pipeline step responsible for finding and activating method `activate` on a view model of a route
 */
class ActivateNextStep {
    run(navigationInstruction, next) {
        return processActivatable(navigationInstruction, 'activate', next, true);
    }
}

/**
 * A multi-slots Pipeline Placeholder Step for hooking into a pipeline execution
 */
class PipelineSlot {
    constructor(container, name, alias) {
        this.steps = [];
        this.container = container;
        this.slotName = name;
        this.slotAlias = alias;
    }
    getSteps() {
        return this.steps.map(x => this.container.get(x));
    }
}
/**
 * Class responsible for creating the navigation pipeline.
 */
class PipelineProvider {
    /**@internal */
    static inject() { return [Container]; }
    constructor(container) {
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
    /**
     * Create the navigation pipeline.
     */
    createPipeline(useCanDeactivateStep = true) {
        let pipeline = new Pipeline();
        this.steps.forEach(step => {
            if (useCanDeactivateStep || step !== CanDeactivatePreviousStep) {
                pipeline.addStep(this.container.get(step));
            }
        });
        return pipeline;
    }
    /**@internal */
    _findStep(name) {
        // Steps that are not PipelineSlots are constructor functions, and they will automatically fail. Probably.
        return this.steps.find(x => x.slotName === name || x.slotAlias === name);
    }
    /**
     * Adds a step into the pipeline at a known slot location.
     */
    addStep(name, step) {
        let found = this._findStep(name);
        if (found) {
            let slotSteps = found.steps;
            // prevent duplicates
            if (!slotSteps.includes(step)) {
                slotSteps.push(step);
            }
        }
        else {
            throw new Error(`Invalid pipeline slot name: ${name}.`);
        }
    }
    /**
     * Removes a step from a slot in the pipeline
     */
    removeStep(name, step) {
        let slot = this._findStep(name);
        if (slot) {
            let slotSteps = slot.steps;
            slotSteps.splice(slotSteps.indexOf(step), 1);
        }
    }
    /**
     * Clears all steps from a slot in the pipeline
     * @internal
     */
    _clearSteps(name = '') {
        let slot = this._findStep(name);
        if (slot) {
            slot.steps = [];
        }
    }
    /**
     * Resets all pipeline slots
     */
    reset() {
        this._clearSteps("authorize" /* Authorize */);
        this._clearSteps("preActivate" /* PreActivate */);
        this._clearSteps("preRender" /* PreRender */);
        this._clearSteps("postRender" /* PostRender */);
    }
}
/**@internal */
const createPipelineSlot = (container, name, alias) => {
    return new PipelineSlot(container, name, alias);
};

const logger = getLogger('app-router');
/**
 * The main application router.
 */
class AppRouter extends Router {
    /**@internal */
    static inject() { return [Container, History, PipelineProvider, EventAggregator]; }
    constructor(container, history, pipelineProvider, events) {
        super(container, history); // Note the super will call reset internally.
        this.pipelineProvider = pipelineProvider;
        this.events = events;
    }
    /**
     * Fully resets the router's internal state. Primarily used internally by the framework when multiple calls to setRoot are made.
     * Use with caution (actually, avoid using this). Do not use this to simply change your navigation model.
     */
    reset() {
        super.reset();
        this.maxInstructionCount = 10;
        if (!this._queue) {
            this._queue = [];
        }
        else {
            this._queue.length = 0;
        }
    }
    /**
     * Loads the specified URL.
     *
     * @param url The URL fragment to load.
     */
    loadUrl(url) {
        return this
            ._createNavigationInstruction(url)
            .then(instruction => this._queueInstruction(instruction))
            .catch(error => {
            logger.error(error);
            restorePreviousLocation(this);
        });
    }
    /**
     * Registers a viewPort to be used as a rendering target for activated routes.
     *
     * @param viewPort The viewPort. This is typically a <router-view/> element in Aurelia default impl
     * @param name The name of the viewPort. 'default' if unspecified.
     */
    registerViewPort(viewPort, name) {
        // having strong typing without changing public API
        const $viewPort = viewPort;
        super.registerViewPort($viewPort, name);
        // beside adding viewport to the registry of this instance
        // AppRouter also configure routing/history to start routing functionality
        // There are situation where there are more than 1 <router-view/> element at root view
        // in that case, still only activate once via the following guard
        if (!this.isActive) {
            const viewModel = this._findViewModel($viewPort);
            if ('configureRouter' in viewModel) {
                // If there are more than one <router-view/> element at root view
                // use this flag to guard against configure method being invoked multiple times
                // this flag is set inside method configure
                if (!this.isConfigured) {
                    // replace the real resolve with a noop to guarantee that any action in base class Router
                    // won't resolve the configurePromise prematurely
                    const resolveConfiguredPromise = this._resolveConfiguredPromise;
                    this._resolveConfiguredPromise = () => { };
                    return this
                        .configure(config => Promise
                        .resolve(viewModel.configureRouter(config, this))
                        // an issue with configure interface. Should be fixed there
                        // todo: fix this via configure interface in router
                        .then(() => config))
                        .then(() => {
                        this.activate();
                        resolveConfiguredPromise();
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
    }
    /**
     * Activates the router. This instructs the router to begin listening for history changes and processing instructions.
     *
     * @params options The set of options to activate the router with.
     */
    activate(options) {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        // route handler property is responsible for handling url change
        // the interface of aurelia-history isn't clear on this perspective
        this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
        this.history.activate(this.options);
        this._dequeueInstruction();
    }
    /**
     * Deactivates the router.
     */
    deactivate() {
        this.isActive = false;
        this.history.deactivate();
    }
    /**@internal */
    _queueInstruction(instruction) {
        return new Promise((resolve) => {
            instruction.resolve = resolve;
            this._queue.unshift(instruction);
            this._dequeueInstruction();
        });
    }
    /**@internal */
    _dequeueInstruction(instructionCount = 0) {
        return Promise.resolve().then(() => {
            if (this.isNavigating && !instructionCount) {
                // ts complains about inconsistent returns without void 0
                return void 0;
            }
            let instruction = this._queue.shift();
            this._queue.length = 0;
            if (!instruction) {
                // ts complains about inconsistent returns without void 0
                return void 0;
            }
            this.isNavigating = true;
            let navtracker = this.history.getState('NavigationTracker');
            let currentNavTracker = this.currentNavigationTracker;
            if (!navtracker && !currentNavTracker) {
                this.isNavigatingFirst = true;
                this.isNavigatingNew = true;
            }
            else if (!navtracker) {
                this.isNavigatingNew = true;
            }
            else if (!currentNavTracker) {
                this.isNavigatingRefresh = true;
            }
            else if (currentNavTracker < navtracker) {
                this.isNavigatingForward = true;
            }
            else if (currentNavTracker > navtracker) {
                this.isNavigatingBack = true;
            }
            if (!navtracker) {
                navtracker = Date.now();
                this.history.setState('NavigationTracker', navtracker);
            }
            this.currentNavigationTracker = navtracker;
            instruction.previousInstruction = this.currentInstruction;
            let maxInstructionCount = this.maxInstructionCount;
            if (!instructionCount) {
                this.events.publish("router:navigation:processing" /* Processing */, { instruction });
            }
            else if (instructionCount === maxInstructionCount - 1) {
                logger.error(`${instructionCount + 1} navigation instructions have been attempted without success. Restoring last known good location.`);
                restorePreviousLocation(this);
                return this._dequeueInstruction(instructionCount + 1);
            }
            else if (instructionCount > maxInstructionCount) {
                throw new Error('Maximum navigation attempts exceeded. Giving up.');
            }
            let pipeline = this.pipelineProvider.createPipeline(!this.couldDeactivate);
            return pipeline
                .run(instruction)
                .then(result => processResult(instruction, result, instructionCount, this))
                .catch(error => {
                return { output: error instanceof Error ? error : new Error(error) };
            })
                .then(result => resolveInstruction(instruction, result, !!instructionCount, this));
        });
    }
    /**@internal */
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
}
const processResult = (instruction, result, instructionCount, router) => {
    if (!(result && 'completed' in result && 'output' in result)) {
        result = result || {};
        result.output = new Error(`Expected router pipeline to return a navigation result, but got [${JSON.stringify(result)}] instead.`);
    }
    let finalResult = null;
    let navigationCommandResult = null;
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
        .then(_ => router._dequeueInstruction(instructionCount + 1))
        .then(innerResult => finalResult || innerResult || result);
};
const resolveInstruction = (instruction, result, isInnerInstruction, router) => {
    instruction.resolve(result);
    let eventAggregator = router.events;
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
            eventName = "router:navigation:error" /* Error */;
        }
        else if (!result.completed) {
            eventName = "router:navigation:canceled" /* Canceled */;
        }
        else {
            let queryString = instruction.queryString ? ('?' + instruction.queryString) : '';
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
const restorePreviousLocation = (router) => {
    let previousLocation = router.history.previousLocation;
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
var PipelineStatus;
(function (PipelineStatus) {
    PipelineStatus["Completed"] = "completed";
    PipelineStatus["Canceled"] = "canceled";
    PipelineStatus["Rejected"] = "rejected";
    PipelineStatus["Running"] = "running";
})(PipelineStatus || (PipelineStatus = {}));

/**
 * A list of known router events used by the Aurelia router
 * to signal the pipeline has come to a certain state
 */
// const enum is preserved in tsconfig
var RouterEvent;
(function (RouterEvent) {
    RouterEvent["Processing"] = "router:navigation:processing";
    RouterEvent["Error"] = "router:navigation:error";
    RouterEvent["Canceled"] = "router:navigation:canceled";
    RouterEvent["Complete"] = "router:navigation:complete";
    RouterEvent["Success"] = "router:navigation:success";
    RouterEvent["ChildComplete"] = "router:navigation:child:complete";
})(RouterEvent || (RouterEvent = {}));

/**
 * Available pipeline slot names to insert interceptor into router pipeline
 */
// const enum is preserved in tsconfig
var PipelineSlotName;
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
})(PipelineSlotName || (PipelineSlotName = {}));

export { ActivateNextStep, AppRouter, BuildNavigationPlanStep, CanActivateNextStep, CanDeactivatePreviousStep, CommitChangesStep, DeactivatePreviousStep, LoadRouteStep, NavModel, NavigationInstruction, Pipeline, PipelineProvider, PipelineSlotName, PipelineStatus, Redirect, RedirectToRoute, RouteLoader, Router, RouterConfiguration, RouterEvent, activationStrategy, isNavigationCommand };
//# sourceMappingURL=aurelia-router.js.map
