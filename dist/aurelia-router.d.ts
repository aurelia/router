import { Container } from 'aurelia-dependency-injection';
import { EventAggregator } from 'aurelia-event-aggregator';
import { History, NavigationOptions } from 'aurelia-history';

/**
* Class for storing and interacting with a route's navigation settings.
*/
export declare class NavModel {
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
	config: RouteConfig;
	/**
	* The router associated with this navigation model.
	*/
	router: Router;
	order: number | boolean;
	constructor(router: Router, relativeHref: string);
	/**
	* Sets the route's title and updates document.title.
	*  If the a navigation is in progress, the change will be applied
	*  to document.title when the navigation completes.
	*
	* @param title The new title.
	*/
	setTitle(title: string): void;
}
/**
 * Class used to configure a [[Router]] instance.
 *
 * @constructor
 */
export declare class RouterConfiguration {
	instructions: Array<(router: Router) => void>;
	options: {
		[key: string]: any;
		compareQueryParams?: boolean;
		root?: string;
		pushState?: boolean;
		hashChange?: boolean;
		silent?: boolean;
	};
	pipelineSteps: Array<{
		name: string;
		step: Function | PipelineStep;
	}>;
	title: string;
	titleSeparator: string;
	unknownRouteConfig: RouteConfigSpecifier;
	viewPortDefaults: Record<string, any>;
	/**
	 * Adds a step to be run during the [[Router]]'s navigation pipeline.
	 *
	 * @param name The name of the pipeline slot to insert the step into.
	 * @param step The pipeline step.
	 * @chainable
	 */
	addPipelineStep(name: string, step: Function | PipelineStep): RouterConfiguration;
	/**
	 * Adds a step to be run during the [[Router]]'s authorize pipeline slot.
	 *
	 * @param step The pipeline step.
	 * @chainable
	 */
	addAuthorizeStep(step: Function | PipelineStep): RouterConfiguration;
	/**
	 * Adds a step to be run during the [[Router]]'s preActivate pipeline slot.
	 *
	 * @param step The pipeline step.
	 * @chainable
	 */
	addPreActivateStep(step: Function | PipelineStep): RouterConfiguration;
	/**
	 * Adds a step to be run during the [[Router]]'s preRender pipeline slot.
	 *
	 * @param step The pipeline step.
	 * @chainable
	 */
	addPreRenderStep(step: Function | PipelineStep): RouterConfiguration;
	/**
	 * Adds a step to be run during the [[Router]]'s postRender pipeline slot.
	 *
	 * @param step The pipeline step.
	 * @chainable
	 */
	addPostRenderStep(step: Function | PipelineStep): RouterConfiguration;
	/**
	 * Configures a route that will be used if there is no previous location available on navigation cancellation.
	 *
	 * @param fragment The URL fragment to use as the navigation destination.
	 * @chainable
	 */
	fallbackRoute(fragment: string): RouterConfiguration;
	/**
	 * Maps one or more routes to be registered with the router.
	 *
	 * @param route The [[RouteConfig]] to map, or an array of [[RouteConfig]] to map.
	 * @chainable
	 */
	map(route: RouteConfig | RouteConfig[]): RouterConfiguration;
	/**
	 * Configures defaults to use for any view ports.
	 *
	 * @param viewPortConfig a view port configuration object to use as a
	 *  default, of the form { viewPortName: { moduleId } }.
	 * @chainable
	 */
	useViewPortDefaults(viewPortConfig: Record<string, {
		[key: string]: any;
		moduleId: string;
	}>): RouterConfiguration;
	/**
	 * Maps a single route to be registered with the router.
	 *
	 * @param route The [[RouteConfig]] to map.
	 * @chainable
	 */
	mapRoute(config: RouteConfig): RouterConfiguration;
	/**
	 * Registers an unknown route handler to be run when the URL fragment doesn't match any registered routes.
	 *
	 * @param config A string containing a moduleId to load, or a [[RouteConfig]], or a function that takes the
	 *  [[NavigationInstruction]] and selects a moduleId to load.
	 * @chainable
	 */
	mapUnknownRoutes(config: RouteConfigSpecifier): RouterConfiguration;
	/**
	 * Applies the current configuration to the specified [[Router]].
	 *
	 * @param router The [[Router]] to apply the configuration to.
	 */
	exportToRouter(router: Router): void;
}
/**
 * The primary class responsible for handling routing and navigation.
 */
export declare class Router {
	/**
	 * Container associated with this router. Also used to create child container for creating child router.
	 */
	container: Container;
	/**
	 * History instance of Aurelia abstract class for wrapping platform history global object
	 */
	history: History;
	/**
	 * A registry of registered viewport. Will be used to handle process navigation instruction route loading
	 * and dom swapping
	 */
	viewPorts: Record<string, any>;
	/**
	 * List of route configs registered with this router
	 */
	routes: RouteConfig[];
	/**
	* The [[Router]]'s current base URL, typically based on the [[Router.currentInstruction]].
	*/
	baseUrl: string;
	/**
	 * If defined, used in generation of document title for [[Router]]'s routes.
	 */
	title: string | undefined;
	/**
	 * The separator used in the document title between [[Router]]'s routes.
	 */
	titleSeparator: string | undefined;
	/**
	 * True if the [[Router]] has been configured.
	 */
	isConfigured: boolean;
	/**
	 * True if the [[Router]] is currently processing a navigation.
	 */
	isNavigating: boolean;
	/**
	 * True if the [[Router]] is navigating due to explicit call to navigate function(s).
	 */
	isExplicitNavigation: boolean;
	/**
	 * True if the [[Router]] is navigating due to explicit call to navigateBack function.
	 */
	isExplicitNavigationBack: boolean;
	/**
	 * True if the [[Router]] is navigating into the app for the first time in the browser session.
	 */
	isNavigatingFirst: boolean;
	/**
	 * True if the [[Router]] is navigating to a page instance not in the browser session history.
	 */
	isNavigatingNew: boolean;
	/**
	 * True if the [[Router]] is navigating forward in the browser session history.
	 */
	isNavigatingForward: boolean;
	/**
	 * True if the [[Router]] is navigating back in the browser session history.
	 */
	isNavigatingBack: boolean;
	/**
	 * True if the [[Router]] is navigating due to a browser refresh.
	 */
	isNavigatingRefresh: boolean;
	/**
	 * True if the previous instruction successfully completed the CanDeactivatePreviousStep in the current navigation.
	 */
	couldDeactivate: boolean;
	/**
	 * The currently active navigation tracker.
	 */
	currentNavigationTracker: number;
	/**
	 * The navigation models for routes that specified [[RouteConfig.nav]].
	 */
	navigation: NavModel[];
	/**
	 * The currently active navigation instruction.
	 */
	currentInstruction: NavigationInstruction;
	/**
	 * The parent router, or null if this instance is not a child router.
	 */
	parent: Router;
	options: any;
	/**
	 * The defaults used when a viewport lacks specified content
	 */
	viewPortDefaults: Record<string, any>;
	/**
	 * Extension point to transform the document title before it is built and displayed.
	 * By default, child routers delegate to the parent router, and the app router
	 * returns the title unchanged.
	 */
	transformTitle: (title: string) => string;
	/**
	 * @param container The [[Container]] to use when child routers.
	 * @param history The [[History]] implementation to delegate navigation requests to.
	 */
	constructor(container: Container, history: History);
	/**
	 * Fully resets the router's internal state. Primarily used internally by the framework when multiple calls to setRoot are made.
	 * Use with caution (actually, avoid using this). Do not use this to simply change your navigation model.
	 */
	reset(): void;
	/**
	 * Gets a value indicating whether or not this [[Router]] is the root in the router tree. I.e., it has no parent.
	 */
	readonly isRoot: boolean;
	/**
	 * Registers a viewPort to be used as a rendering target for activated routes.
	 *
	 * @param viewPort The viewPort.
	 * @param name The name of the viewPort. 'default' if unspecified.
	 */
	registerViewPort(viewPort: any, name?: string): void;
	/**
	 * Returns a Promise that resolves when the router is configured.
	 */
	ensureConfigured(): Promise<void>;
	/**
	 * Configures the router.
	 *
	 * @param callbackOrConfig The [[RouterConfiguration]] or a callback that takes a [[RouterConfiguration]].
	 */
	configure(callbackOrConfig: RouterConfiguration | ((config: RouterConfiguration) => RouterConfiguration)): Promise<void>;
	/**
	 * Navigates to a new location.
	 *
	 * @param fragment The URL fragment to use as the navigation destination.
	 * @param options The navigation options.
	 */
	navigate(fragment: string, options?: NavigationOptions): boolean;
	/**
	 * Navigates to a new location corresponding to the route and params specified. Equivallent to [[Router.generate]] followed
	 * by [[Router.navigate]].
	 *
	 * @param route The name of the route to use when generating the navigation location.
	 * @param params The route parameters to be used when populating the route pattern.
	 * @param options The navigation options.
	 */
	navigateToRoute(route: string, params?: any, options?: NavigationOptions): boolean;
	/**
	 * Navigates back to the most recent location in history.
	 */
	navigateBack(): void;
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
	 * @param options If options.absolute = true, then absolute url will be generated; otherwise, it will be relative url.
	 * @returns {string} A string containing the generated URL fragment.
	 */
	generate(nameOrRoute: string | RouteConfig, params?: any, options?: any): string;
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
	addRoute(config: RouteConfig, navModel?: NavModel): void;
	/**
	 * Gets a value indicating whether or not this [[Router]] or one of its ancestors has a route registered with the specified name.
	 *
	 * @param name The name of the route to check.
	 */
	hasRoute(name: string): boolean;
	/**
	 * Gets a value indicating whether or not this [[Router]] has a route registered with the specified name.
	 *
	 * @param name The name of the route to check.
	 */
	hasOwnRoute(name: string): boolean;
	/**
	 * Register a handler to use when the incoming URL fragment doesn't match any registered routes.
	 *
	 * @param config The moduleId, or a function that selects the moduleId, or a [[RouteConfig]].
	 */
	handleUnknownRoutes(config?: RouteConfigSpecifier): void;
	/**
	 * Updates the document title using the current navigation instruction.
	 */
	updateTitle(): void;
	/**
	 * Updates the navigation routes with hrefs relative to the current location.
	 * Note: This method will likely move to a plugin in a future release.
	 */
	refreshNavigation(): void;
	/**
	 * Sets the default configuration for the view ports. This specifies how to
	 *  populate a view port for which no module is specified. The default is
	 *  an empty view/view-model pair.
	 */
	useViewPortDefaults($viewPortDefaults: Record<string, any>): void;
}
/**
 * The strategy to use when activating modules during navigation.
 */
export declare const activationStrategy: ActivationStrategy;
/**
 * An optional interface describing the available activation strategies.
 */
export interface ActivationStrategy {
	/**
	 * Reuse the existing view model, without invoking Router lifecycle hooks.
	 */
	noChange: 'no-change';
	/**
	 * Reuse the existing view model, invoking Router lifecycle hooks.
	 */
	invokeLifecycle: 'invoke-lifecycle';
	/**
	 * Replace the existing view model, invoking Router lifecycle hooks.
	 */
	replace: 'replace';
}
/**
 * Enum like type for activation strategy built-in values
 */
export declare type ActivationStrategyType = ActivationStrategy[keyof ActivationStrategy];
/**
 * Initialization options for a navigation instruction
 */
export interface NavigationInstructionInit {
	fragment: string;
	queryString?: string;
	params?: Record<string, any>;
	queryParams?: Record<string, any>;
	config: RouteConfig;
	parentInstruction?: NavigationInstruction;
	previousInstruction?: NavigationInstruction;
	router: Router;
	options?: Object;
	plan?: Record<string, /*ViewPortInstruction*/ any>;
}
export interface ViewPortInstructionInit {
	name: string;
	strategy: ActivationStrategyType;
	moduleId: string;
	component: ViewPortComponent;
}
/**
 * Class used to represent an instruction during a navigation.
 */
export declare class NavigationInstruction {
	/**
	 * The URL fragment.
	 */
	fragment: string;
	/**
	 * The query string.
	 */
	queryString: string;
	/**
	 * Parameters extracted from the route pattern.
	 */
	params: any;
	/**
	 * Parameters extracted from the query string.
	 */
	queryParams: any;
	/**
	 * The route config for the route matching this instruction.
	 */
	config: RouteConfig;
	/**
	 * The parent instruction, if this instruction was created by a child router.
	 */
	parentInstruction: NavigationInstruction;
	parentCatchHandler: any;
	/**
	 * The instruction being replaced by this instruction in the current router.
	 */
	previousInstruction: NavigationInstruction;
	/**
	 * viewPort instructions to used activation.
	 */
	viewPortInstructions: Record<string, /*ViewPortInstruction*/ any>;
	/**
	 * The router instance.
	 */
	router: Router;
	/**
	 * Current built viewport plan of this nav instruction
	 */
	plan: Record<string, /*ViewPortPlan*/ any>;
	options: Record<string, any>;
	constructor(init: NavigationInstructionInit);
	/**
	 * Gets an array containing this instruction and all child instructions for the current navigation.
	 */
	getAllInstructions(): Array<NavigationInstruction>;
	/**
	 * Gets an array containing the instruction and all child instructions for the previous navigation.
	 * Previous instructions are no longer available after navigation completes.
	 */
	getAllPreviousInstructions(): Array<NavigationInstruction>;
	/**
	 * Adds a viewPort instruction. Returns the newly created instruction based on parameters
	 */
	addViewPortInstruction(initOptions: ViewPortInstructionInit): any;
	addViewPortInstruction(viewPortName: string, strategy: ActivationStrategyType, moduleId: string, component: any): any;
	/**
	 * Gets the name of the route pattern's wildcard parameter, if applicable.
	 */
	getWildCardName(): string;
	/**
	 * Gets the path and query string created by filling the route
	 * pattern's wildcard parameter with the matching param.
	 */
	getWildcardPath(): string;
	/**
	 * Gets the instruction's base URL, accounting for wildcard route parameters.
	 */
	getBaseUrl(): string;
}
/**
* When a navigation command is encountered, the current navigation
* will be cancelled and control will be passed to the navigation
* command so it can determine the correct action.
*/
export interface NavigationCommand {
	navigate: (router: Router) => void;
}
/**
* Determines if the provided object is a navigation command.
* A navigation command is anything with a navigate method.
*
* @param obj The object to check.
*/
export declare function isNavigationCommand(obj: any): obj is NavigationCommand;
/**
* Used during the activation lifecycle to cause a redirect.
*/
export declare class Redirect implements NavigationCommand {
	url: string;
	private router;
	/**
	 * @param url The URL fragment to use as the navigation destination.
	 * @param options The navigation options.
	 */
	constructor(url: string, options?: NavigationOptions);
	/**
	 * Called by the activation system to set the child router.
	 *
	 * @param router The router.
	 */
	setRouter(router: Router): void;
	/**
	 * Called by the navigation pipeline to navigate.
	 *
	 * @param appRouter The router to be redirected.
	 */
	navigate(appRouter: Router): void;
}
/**
 * Used during the activation lifecycle to cause a redirect to a named route.
 */
export declare class RedirectToRoute implements NavigationCommand {
	route: string;
	params: any;
	/**
	 * @param route The name of the route.
	 * @param params The parameters to be sent to the activation method.
	 * @param options The options to use for navigation.
	 */
	constructor(route: string, params?: any, options?: NavigationOptions);
	/**
	 * Called by the activation system to set the child router.
	 *
	 * @param router The router.
	 */
	setRouter(router: Router): void;
	/**
	 * Called by the navigation pipeline to navigate.
	 *
	 * @param appRouter The router to be redirected.
	 */
	navigate(appRouter: Router): void;
}
/**
 * A basic interface for an Observable type
 */
export interface IObservable {
	subscribe(sub?: IObservableConfig): ISubscription;
}
export interface IObservableConfig {
	next(): void;
	error(err?: any): void;
	complete(): void;
}
/**
 * A basic interface for a Subscription to an Observable
 */
export interface ISubscription {
	unsubscribe(): void;
}
/**
* The status of a Pipeline.
*/
export declare const enum PipelineStatus {
	Completed = "completed",
	Canceled = "canceled",
	Rejected = "rejected",
	Running = "running"
}
/**
 * A configuration object that describes a route for redirection
 */
export interface RedirectConfig {
	/**
	 * path that will be redirected to. This is relative to currently in process router
	 */
	redirect: string;
	/**
	 * A backward compat interface. Should be ignored in new code
	 */
	[key: string]: any;
}
/**
 * A more generic RouteConfig for unknown route. Either a redirect config or a `RouteConfig`
 * Redirect config is generally used in `mapUnknownRoutes` of `RouterConfiguration`
 */
export declare type RouteOrRedirectConfig = RouteConfig | RedirectConfig;
/**
 * A RouteConfig specifier. Could be a string, or an object with `RouteConfig` interface shape,
 * or could be an object with redirect interface shape
 */
export declare type RouteConfigSpecifier = string | RouteOrRedirectConfig | ((instruction: NavigationInstruction) => string | RouteOrRedirectConfig | Promise<string | RouteOrRedirectConfig>);
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
	navigationStrategy?: (instruction: NavigationInstruction) => Promise<void> | void;
	/**
	 * The view ports to target when activating this route. If unspecified, the target moduleId is loaded
	 * into the default viewPort (the viewPort with name 'default'). The viewPorts object should have keys
	 * whose property names correspond to names used by <router-view> elements. The values should be objects
	 * specifying the moduleId to load into that viewPort.  The values may optionally include properties related to layout:
	 * `layoutView`, `layoutViewModel` and `layoutModel`.
	 */
	viewPorts?: any;
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
	 * Indicates that when route generation is done for this route, it should just take the literal value of the href property.
	 */
	generationUsesHref?: boolean;
	/**
	 * The document title to set when this route is active.
	 */
	title?: string;
	/**
	 * Arbitrary data to attach to the route. This can be used to attached custom data needed by components
	 * like pipeline steps and activated modules.
	 */
	settings?: any;
	/**
	 * The navigation model for storing and interacting with the route's navigation settings.
	 */
	navModel?: NavModel;
	/**
	 * When true is specified, this route will be case sensitive.
	 */
	caseSensitive?: boolean;
	/**
	 * Add to specify an activation strategy if it is always the same and you do not want that
	 * to be in your view-model code. Available values are 'replace' and 'invoke-lifecycle'.
	 */
	activationStrategy?: ActivationStrategyType;
	/**
	 * specifies the file name of a layout view to use.
	 */
	layoutView?: string;
	/**
	 * specifies the moduleId of the view model to use with the layout view.
	 */
	layoutViewModel?: string;
	/**
	 * specifies the model parameter to pass to the layout view model's `activate` function.
	 */
	layoutModel?: any;
	[x: string]: any;
}
/**
 * An optional interface describing the canActivate convention.
 */
export interface RoutableComponentCanActivate {
	/**
	 * Implement this hook if you want to control whether or not your view-model can be navigated to.
	 * Return a boolean value, a promise for a boolean value, or a navigation command.
	 */
	canActivate(params: any, routeConfig: RouteConfig, navigationInstruction: NavigationInstruction): boolean | Promise<boolean> | PromiseLike<boolean> | NavigationCommand | Promise<NavigationCommand> | PromiseLike<NavigationCommand>;
}
/**
 * An optional interface describing the activate convention.
 */
export interface RoutableComponentActivate {
	/**
	 * Implement this hook if you want to perform custom logic just before your view-model is displayed.
	 * You can optionally return a promise to tell the router to wait to bind and attach the view until
	 * after you finish your work.
	 */
	activate(params: any, routeConfig: RouteConfig, navigationInstruction: NavigationInstruction): Promise<void> | PromiseLike<void> | IObservable | void;
}
/**
 * An optional interface describing the canDeactivate convention.
 */
export interface RoutableComponentCanDeactivate {
	/**
	 * Implement this hook if you want to control whether or not the router can navigate away from your
	 * view-model when moving to a new route. Return a boolean value, a promise for a boolean value,
	 * or a navigation command.
	 */
	canDeactivate: () => boolean | Promise<boolean> | PromiseLike<boolean> | NavigationCommand;
}
/**
 * An optional interface describing the deactivate convention.
 */
export interface RoutableComponentDeactivate {
	/**
	 * Implement this hook if you want to perform custom logic when your view-model is being
	 * navigated away from. You can optionally return a promise to tell the router to wait until
	 * after you finish your work.
	 */
	deactivate: () => Promise<void> | PromiseLike<void> | IObservable | void;
}
/**
 * An optional interface describing the determineActivationStrategy convention.
 */
export interface RoutableComponentDetermineActivationStrategy {
	/**
	 * Implement this hook if you want to give hints to the router about the activation strategy, when reusing
	 * a view model for different routes. Available values are 'replace' and 'invoke-lifecycle'.
	 */
	determineActivationStrategy(params: any, routeConfig: RouteConfig, navigationInstruction: NavigationInstruction): ActivationStrategyType;
}
/**
 * An optional interface describing the router configuration convention.
 */
export interface ConfiguresRouter {
	/**
	 * Implement this hook if you want to configure a router.
	 */
	configureRouter(config: RouterConfiguration, router: Router): Promise<void> | PromiseLike<void> | void;
}
/**
 * A step to be run during processing of the pipeline.
 */
export interface PipelineStep {
	/**
	 * Execute the pipeline step. The step should invoke next(), next.complete(),
	 * next.cancel(), or next.reject() to allow the pipeline to continue.
	 *
	 * @param instruction The navigation instruction.
	 * @param next The next step in the pipeline.
	 */
	run(instruction: NavigationInstruction, next: Next): Promise<any>;
}
/**
 * A multi-step pipeline step that helps enable multiple hooks to the pipeline
 */
export interface IPipelineSlot {
}
/**
 * The result of a pipeline run.
 */
export interface PipelineResult {
	status: string;
	instruction: NavigationInstruction;
	output: any;
	completed: boolean;
}
/**
 * The component responsible for routing
 */
export interface ViewPortComponent {
	viewModel: any;
	childContainer?: Container;
	router: Router;
	config?: RouteConfig;
	childRouter?: Router;
	/**
	 * This is for backward compat, when moving from any to a more strongly typed interface
	 */
	[key: string]: any;
}
export declare type NavigationResult = boolean | Promise<PipelineResult | boolean>;
/**
 * A callback to indicate when pipeline processing should advance to the next step
 * or be aborted.
 */
export interface Next<T = any> {
	/**
	 * Indicates the successful completion of the pipeline step.
	 */
	(): Promise<any>;
	/**
	 * Indicates the successful completion of the entire pipeline.
	 */
	complete: NextCompletionHandler<T>;
	/**
	 * Indicates that the pipeline should cancel processing.
	 */
	cancel: NextCompletionHandler<T>;
	/**
	 * Indicates that pipeline processing has failed and should be stopped.
	 */
	reject: NextCompletionHandler<T>;
}
/**
 * Next Completion result. Comprises of final status, output (could be value/error) and flag `completed`
 */
export interface NextCompletionResult<T = any> {
	status: PipelineStatus;
	output: T;
	completed: boolean;
}
/**
 * Handler for resolving `NextCompletionResult`
 */
export declare type NextCompletionHandler<T = any> = (output?: T) => Promise<NextCompletionResult<T>>;
export declare type StepRunnerFunction = <TThis = any>(this: TThis, instruction: NavigationInstruction, next: Next) => any;
/**
 * The class responsible for managing and processing the navigation pipeline.
 */
export declare class Pipeline {
	/**
	 * The pipeline steps. And steps added via addStep will be converted to a function
	 * The actualy running functions with correct step contexts of this pipeline
	 */
	steps: StepRunnerFunction[];
	/**
	 * Adds a step to the pipeline.
	 *
	 * @param step The pipeline step.
	 */
	addStep(step: StepRunnerFunction | PipelineStep | IPipelineSlot): Pipeline;
	/**
	 * Runs the pipeline.
	 *
	 * @param instruction The navigation instruction to process.
	 */
	run(instruction: NavigationInstruction): Promise<PipelineResult>;
}
/**
 * Class responsible for creating the navigation pipeline.
 */
export declare class PipelineProvider {
	constructor(container: Container);
	/**
	 * Create the navigation pipeline.
	 */
	createPipeline(useCanDeactivateStep?: boolean): Pipeline;
	/**
	 * Adds a step into the pipeline at a known slot location.
	 */
	addStep(name: string, step: PipelineStep | Function): void;
	/**
	 * Removes a step from a slot in the pipeline
	 */
	removeStep(name: string, step: PipelineStep): void;
	/**
	 * Resets all pipeline slots
	 */
	reset(): void;
}
/**
 * The main application router.
 */
export declare class AppRouter extends Router {
	events: EventAggregator;
	constructor(container: Container, history: History, pipelineProvider: PipelineProvider, events: EventAggregator);
	/**
	 * Fully resets the router's internal state. Primarily used internally by the framework when multiple calls to setRoot are made.
	 * Use with caution (actually, avoid using this). Do not use this to simply change your navigation model.
	 */
	reset(): void;
	/**
	 * Loads the specified URL.
	 *
	 * @param url The URL fragment to load.
	 */
	loadUrl(url: string): Promise<NavigationInstruction>;
	/**
	 * Registers a viewPort to be used as a rendering target for activated routes.
	 *
	 * @param viewPort The viewPort. This is typically a <router-view/> element in Aurelia default impl
	 * @param name The name of the viewPort. 'default' if unspecified.
	 */
	registerViewPort(viewPort: any, name?: string): Promise<any>;
	/**
	 * Activates the router. This instructs the router to begin listening for history changes and processing instructions.
	 *
	 * @params options The set of options to activate the router with.
	 */
	activate(options?: NavigationOptions): void;
	/**
	 * Deactivates the router.
	 */
	deactivate(): void;
}
/**
 * A pipeline step responsible for finding and activating method `canDeactivate` on a view model of a route
 */
export declare class CanDeactivatePreviousStep {
	run(navigationInstruction: NavigationInstruction, next: Next): Promise<any>;
}
/**
 * A pipeline step responsible for finding and activating method `canActivate` on a view model of a route
 */
export declare class CanActivateNextStep {
	run(navigationInstruction: NavigationInstruction, next: Next): Promise<any>;
}
/**
 * A pipeline step responsible for finding and activating method `deactivate` on a view model of a route
 */
export declare class DeactivatePreviousStep {
	run(navigationInstruction: NavigationInstruction, next: Next): Promise<any>;
}
/**
 * A pipeline step responsible for finding and activating method `activate` on a view model of a route
 */
export declare class ActivateNextStep {
	run(navigationInstruction: NavigationInstruction, next: Next): Promise<any>;
}
/**
 * A pipeline step for instructing a piepline to commit changes on a navigation instruction
 */
export declare class CommitChangesStep {
	run(navigationInstruction: NavigationInstruction, next: Function): Promise<any>;
}
/**
 * Transform a navigation instruction into viewport plan record object,
 * or a redirect request if user viewmodel demands
 */
export declare class BuildNavigationPlanStep {
	run(navigationInstruction: NavigationInstruction, next: Next): Promise<any>;
}
/**
 * Abstract class that is responsible for loading view / view model from a route config
 * The default implementation can be found in `aurelia-templating-router`
 */
export declare class RouteLoader {
	/**
	 * Load a route config based on its viewmodel / view configuration
	 */
	loadRoute(router: Router, config: RouteConfig, navigationInstruction: NavigationInstruction): Promise</*ViewPortInstruction*/ any>;
}
/**
 * A pipeline step responsible for loading a route config of a navigation instruction
 */
export declare class LoadRouteStep {
	constructor(routeLoader: RouteLoader);
	/**
	 * Run the internal to load route config of a navigation instruction to prepare for next steps in the pipeline
	 */
	run(navigationInstruction: NavigationInstruction, next: Next): Promise<any>;
}
/**
 * A list of known router events used by the Aurelia router
 * to signal the pipeline has come to a certain state
 */
export declare const enum RouterEvent {
	Processing = "router:navigation:processing",
	Error = "router:navigation:error",
	Canceled = "router:navigation:canceled",
	Complete = "router:navigation:complete",
	Success = "router:navigation:success",
	ChildComplete = "router:navigation:child:complete"
}
/**
 * Available pipeline slot names to insert interceptor into router pipeline
 */
export declare const enum PipelineSlotName {
	/**
	 * Authorization slot. Invoked early in the pipeline,
	 * before `canActivate` hook of incoming route
	 */
	Authorize = "authorize",
	/**
	 * Pre-activation slot. Invoked early in the pipeline,
	 * Invoked timing:
	 *   - after Authorization slot
	 *   - after canActivate hook on new view model
	 *   - before deactivate hook on old view model
	 *   - before activate hook on new view model
	 */
	PreActivate = "preActivate",
	/**
	 * Pre-render slot. Invoked later in the pipeline
	 * Invokcation timing:
	 *   - after activate hook on new view model
	 *   - before commit step on new navigation instruction
	 */
	PreRender = "preRender",
	/**
	 * Post-render slot. Invoked last in the pipeline
	 */
	PostRender = "postRender"
}