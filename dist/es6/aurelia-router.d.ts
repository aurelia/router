declare module 'aurelia-router' {
  import * as core from 'core-js';
  import * as LogManager from 'aurelia-logging';
  import { Container }  from 'aurelia-dependency-injection';
  import { RouteRecognizer }  from 'aurelia-route-recognizer';
  import { join }  from 'aurelia-path';
  import { History }  from 'aurelia-history';
  import { EventAggregator }  from 'aurelia-event-aggregator';
  
  /**
  * A configuration object that describes a route.
  */
  export interface RouteConfig {
    
    /**
      * The route pattern to match against incoming URL fragments, or an array of patterns.
      */
    route: string | string[];
    
    /**
      * A unique name for the route that may be used to identify the route when generating URL fragments.
      * Required when this route should support URL generation, such as with [[Router.generate]] or
      * the route-href custom attribute.
      */
    name?: string;
    
    /**
      * The moduleId of the view model that should be activated for this route.
      */
    moduleId?: string;
    
    /**
      * A URL fragment to redirect to when this route is matched.
      */
    redirect?: string;
    
    /**
      * A function that can be used to dynamically select the module or modules to activate.
      * The function is passed the current [[NavigationInstruction]], and should configure
      * instruction.config with the desired moduleId, viewPorts, or redirect.
      */
    // navigationStrategy?: (instruction:NavigationInstruction) => Promise<void>|void;
    /**
      * The view ports to target when activating this route. If unspecified, the target moduleId is loaded
      * into the default viewPort (the viewPort with name 'default'). The viewPorts object should have keys
      * whose property names correspond to names used by <router-view> elements. The values should be objects
      * specifying the moduleId to load into that viewPort.
      */
    viewPorts?: Object;
    
    /**
      * When specified, this route will be included in the [[Router.navigation]] nav model. Useful for
      * dynamically generating menus or other navigation elements. When a number is specified, that value
      * will be used as a sort order.
      */
    nav?: boolean | number;
    
    /**
      * The URL fragment to use in nav models. If unspecified, the [[RouteConfig.route]] will be used.
      * However, if the [[RouteConfig.route]] contains dynamic segments, this property must be specified.
      */
    href?: string;
    
    /**
      * The document title to set when this route is active.
      */
    title?: string;
  }
  export class RouteFilterContainer {
    static inject(): any;
    constructor(container: any);
    addStep(name: any, step: any, index?: any): any;
    getFilterSteps(name: any): any;
  }
  export function createRouteFilterStep(name: any): any;
  class RouteFilterStep {
    constructor(name: any, routeFilterContainer: any);
    getSteps(): any;
  }
  export const pipelineStatus: any;
  export class Pipeline {
    constructor();
    withStep(step: any): any;
    run(ctx: any): any;
  }
  export class NavigationInstruction {
    fragment: string;
    queryString: string;
    params: any;
    queryParams: any;
    config: any;
    parentInstruction: NavigationInstruction;
    constructor(fragment: string, queryString?: string, params?: any, queryParams?: any, config?: any, parentInstruction?: NavigationInstruction);
    addViewPortInstruction(viewPortName: any, strategy: any, moduleId: any, component: any): any;
    getWildCardName(): string;
    getWildcardPath(): string;
    getBaseUrl(): string;
  }
  
  /**
  * Class for storing and interacting with a route's navigation settings.
  *
  * @class NavModel
  * @constructor
  */
  export class NavModel {
    
    /**
      * True if this nav item is currently active.
      */
    isActive: boolean;
    
    /**
      * The title.
      */
    title: string;
    
    /**
      * This nav item's absolute href.
      */
    href: string;
    
    /**
      * This nav item's relative href.
      */
    relativeHref: string;
    
    /**
      * Data attached to the route at configuration time.
      */
    settings: any;
    
    /**
      * The route config.
      */
    config: Object;
    constructor(router: any, relativeHref: any);
    
    /**
      * Sets the route's title and updates document.title.
      *  If the a navigation is in progress, the change will be applied
      *  to document.title when the navigation completes.
      *
      * @method setTitle
      * @param title The new title.
      */
    setTitle(title: any): any;
  }
  export function processPotential(obj: any, resolve: any, reject: any): any;
  export function normalizeAbsolutePath(path: any, hasPushState: any): any;
  export function createRootedPath(fragment: any, baseUrl: any, hasPushState: any): any;
  export function resolveUrl(fragment: any, baseUrl: any, hasPushState: any): any;
  
  /**
   * Determines if the provided object is a navigation command.
   * A navigation command is anything with a navigate method.
   * @param {object} obj The item to check.
   * @return {boolean}
   */
  export function isNavigationCommand(obj: any): any;
  
  /**
  * Used during the activation lifecycle to cause a redirect.
  *
  * @class Redirect
  * @constructor
  * @param {String} url The url to redirect to.
  */
  export class Redirect {
    constructor(url: any, options: any);
    
    /**
      * Called by the activation system to set the child router.
      *
      * @method setRouter
      * @param {Router} router
      */
    setRouter(router: any): any;
    
    /**
      * Called by the navigation pipeline to navigate.
      *
      * @method navigate
      * @param {Router} appRouter - a router which should redirect
      */
    navigate(appRouter: any): any;
  }
  
  /**
   * Class used to configure a [[Router]] instance.
   *
   * @constructor
   */
  export class RouterConfiguration {
    instructions: any;
    options: any;
    pipelineSteps: any;
    title: any;
    unknownRouteConfig: any;
    
    /**
      * Adds a step to be run during the [[Router]]'s navigation pipeline.
      *
      * @param name The name of the pipeline slot to insert the step into.
      * @param step The pipeline step.
      * @chainable
      */
    addPipelineStep(name: string, step: Object | Function): any;
    
    /**
      * Maps one or more routes to be registered with the router.
      *
      * @param route The [[RouteConfig]] to map, or an array of [[RouteConfig]] to map.
      * @chainable
      */
    map(route: RouteConfig | RouteConfig[]): any;
    
    /**
      * Maps a single route to be registered with the router.
      *
      * @param route The [[RouteConfig]] to map.
      * @chainable
      */
    mapRoute(config: RouteConfig): any;
    
    /**
      * Registers an unknown route handler to be run when the URL fragment doesn't match any registered routes.
      *
      * @param config A string containing a moduleId to load, or a [[RouteConfig]], or a function that takes the
      *  [[NavigationInstruction]] and selects a moduleId to load.
      * @chainable
      */
    mapUnknownRoutes(config: string | RouteConfig | ((instruction: NavigationInstruction) => Promise<void>)): any;
    
    /**
      * Applies the current configuration to the specified [[Router]].
      *
      * @param router The [[Router]] to apply the configuration to.
      */
    exportToRouter(router: Router): any;
  }
  export const activationStrategy: any;
  export function buildNavigationPlan(navigationContext: any, forceLifecycleMinimum: any): any;
  export class BuildNavigationPlanStep {
    run(navigationContext: any, next: any): any;
  }
  export var affirmations: any;
  export class CanDeactivatePreviousStep {
    run(navigationContext: any, next: any): any;
  }
  export class CanActivateNextStep {
    run(navigationContext: any, next: any): any;
  }
  export class DeactivatePreviousStep {
    run(navigationContext: any, next: any): any;
  }
  export class ActivateNextStep {
    run(navigationContext: any, next: any): any;
  }
  export class NavigationContext {
    constructor(router: any, nextInstruction: any);
    getAllContexts(acc?: any): any;
    nextInstructions(): any;
    currentInstructions(): any;
    prevInstructions(): any;
    commitChanges(waitToSwap: any): any;
    updateTitle(): any;
    buildTitle(separator?: any): any;
  }
  export class CommitChangesStep {
    run(navigationContext: any, next: any): any;
  }
  export class RouteLoader {
    loadRoute(router: any, config: any, navigationContext: any): any;
  }
  export class LoadRouteStep {
    static inject(): any;
    constructor(routeLoader: any);
    run(navigationContext: any, next: any): any;
  }
  export function loadNewRoute(routeLoader: any, navigationContext: any): any;
  
  /**
  * The primary class responsible for handling routing and navigation.
  *
  * @class Router
  * @constructor
  */
  export class Router {
    container: Container;
    history: History;
    viewPorts: Object;
    fallbackOrder: number;
    recognizer: RouteRecognizer;
    childRecognizer: RouteRecognizer;
    routes: RouteConfig[];
    
    /**
      * The [[Router]]'s current base URL, typically based on the [[Router.currentInstruction]].
      */
    baseUrl: string;
    
    /**
      * True if the [[Router]] has been configured.
      */
    isConfigured: boolean;
    
    /**
      * True if the [[Router]] is currently processing a navigation.
      */
    isNavigating: boolean;
    
    /**
      * The navigation models for routes that specified [[RouteConfig.nav]].
      */
    navigation: NavModel[];
    
    /**
      * The currently active navigation instruction.
      */
    currentInstruction: NavigationInstruction;
    
    /**
      * @param container The [[Container]] to use when child routers.
      * @param history The [[History]] implementation to delegate navigation requests to.
      */
    constructor(container: any, history: any);
    
    /**
      * Gets a valid undicating whether or not this [[Router]] is the root in the router tree. I.e., it has no parent.
      */
    isRoot(): any;
    
    /**
      * Registers a viewPort to be used as a rendering target for activated routes.
      *
      * @param viewPort The viewPort.
      * @param name The name of the viewPort. 'default' if unspecified.
      */
    registerViewPort(viewPort: Object, name?: string): any;
    
    /**
      * Returns a Promise that resolves when the router is configured.
      */
    ensureConfigured(): Promise<void>;
    
    /**
      * Configures the router.
      *
      * @param callbackOrConfig The [[RouterConfiguration]] or a callback that takes a [[RouterConfiguration]].
      * @chainable
      */
    configure(callbackOrConfig: RouterConfiguration | ((config: RouterConfiguration) => RouterConfiguration)): Router;
    
    /**
      * Navigates to a new location.
      *
      * @param fragment The URL fragment to use as the navigation destination.
      * @param options The navigation options.
      */
    navigate(fragment: string, options?: Object): boolean;
    
    /**
      * Navigates to a new location corresponding to the route and params specified. Equivallent to [[Router.generate]] followed
      * by [[Router.navigate]].
      *
      * @param route The name of the route to use when generating the navigation location.
      * @param params The route parameters to be used when populating the route pattern.
      * @param options The navigation options.
      */
    navigateToRoute(route: string, params?: Object, options?: Object): boolean;
    
    /**
      * Navigates back to the most recent location in history.
      */
    navigateBack(): any;
    
    /**
       * Creates a child router of the current router.
       *
       * @param container The [[Container]] to provide to the child router. Uses the current [[Router]]'s [[Container]] if unspecified.
       * @returns {Router} The new child Router.
       */
    createChild(container?: Container): Router;
    
    /**
      * Generates a URL fragment matching the specified route pattern.
      *
      * @param name The name of the route whose pattern should be used to generate the fragment.
      * @param params The route params to be used to populate the route pattern.
      * @returns {string} A string containing the generated URL fragment.
      */
    generate(name: string, params?: Object): string;
    
    /**
      * Creates a [[NavModel]] for the specified route config.
      *
      * @param config The route config.
      */
    createNavModel(config: RouteConfig): NavModel;
    
    /**
      * Registers a new route with the router.
      *
      * @param config The [[RouteConfig]].
      * @param navModel The [[NavModel]] to use for the route. May be omitted for single-pattern routes.
      */
    addRoute(config: RouteConfig, navModel?: NavModel): any;
    
    /**
      * Gets a value indicating whether or not this [[Router]] or one of its ancestors has a route registered with the specified name.
      *
      * @param name The name of the route to check.
      * @returns {boolean}
      */
    hasRoute(name: string): boolean;
    
    /**
      * Gets a value indicating whether or not this [[Router]] has a route registered with the specified name.
      *
      * @param name The name of the route to check.
      * @returns {boolean}
      */
    hasOwnRoute(name: string): boolean;
    
    /**
      * Register a handler to use when the incoming URL fragment doesn't match any registered routes.
      *
      * @param config The moduleId, or a function that selects the moduleId, or a [[RouteConfig]].
      */
    handleUnknownRoutes(config?: string | Function | RouteConfig): any;
    
    /**
      * Updates the document title using the current navigation instruction.
      */
    updateTitle(): any;
    
    /**
      * Resets the Router to its original unconfigured state.
      */
    reset(): any;
    refreshBaseUrl(): any;
    refreshNavigation(): any;
    createNavigationInstruction(url?: string, parentInstruction?: NavigationInstruction): Promise<NavigationInstruction>;
    createNavigationContext(instruction: NavigationInstruction): NavigationContext;
  }
  export class PipelineProvider {
    static inject(): any;
    constructor(container: any);
    createPipeline(navigationContext: any): any;
  }
  export class AppRouter extends Router {
    static inject(): any;
    constructor(container: any, history: any, pipelineProvider: any, events: any);
    isRoot(): any;
    loadUrl(url: any): any;
    queueInstruction(instruction: any): any;
    dequeueInstruction(instructionCount?: any): any;
    registerViewPort(viewPort: any, name: any): any;
    activate(options: any): any;
    deactivate(): any;
    reset(): any;
  }
}