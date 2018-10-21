'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var aureliaRouteRecognizer = require('aurelia-route-recognizer');
var aureliaDependencyInjection = require('aurelia-dependency-injection');
var LogManager = require('aurelia-logging');
var aureliaHistory = require('aurelia-history');
var aureliaEventAggregator = require('aurelia-event-aggregator');

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

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
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
* The strategy to use when activating modules during navigation.
*/
var activationStrategy = {
    noChange: 'no-change',
    invokeLifecycle: 'invoke-lifecycle',
    replace: 'replace'
};
var BuildNavigationPlanStep = /** @class */ (function () {
    function BuildNavigationPlanStep() {
    }
    BuildNavigationPlanStep.prototype.run = function (navigationInstruction, next) {
        return _buildNavigationPlan(navigationInstruction)
            .then(function (plan) {
            if (plan instanceof Redirect) {
                return next.cancel(plan);
            }
            navigationInstruction.plans = plan;
            return next();
        })
            .catch(next.cancel);
    };
    return BuildNavigationPlanStep;
}());
function _buildNavigationPlan(instruction, forceLifecycleMinimum) {
    return __awaiter(this, void 0, void 0, function () {
        var config, router, newInstruction, params, key, val, redirectLocation, prev, viewPortPlans, defaults, hasNewParams, pending_1, _loop_1, viewPortName, viewPortName, viewPortConfig;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    config = instruction.config;
                    if (!('redirect' in config)) return [3 /*break*/, 2];
                    router = instruction.router;
                    return [4 /*yield*/, router._createNavigationInstruction(config.redirect)];
                case 1:
                    newInstruction = _a.sent();
                    params = {};
                    for (key in newInstruction.params) {
                        val = newInstruction.params[key];
                        if (typeof val === 'string' && val[0] === ':') {
                            val = val.slice(1);
                            // And if that param is found on the original instruction then use it
                            if (val in instruction.params) {
                                params[key] = instruction.params[val];
                            }
                        }
                        else {
                            params[key] = newInstruction.params[key];
                        }
                    }
                    redirectLocation = router.generate(newInstruction.config.name, params, instruction.options);
                    if (instruction.queryString) {
                        redirectLocation += '?' + instruction.queryString;
                    }
                    return [2 /*return*/, new Redirect(redirectLocation)];
                case 2:
                    prev = instruction.previousInstruction;
                    viewPortPlans = {};
                    defaults = instruction.router.viewPortDefaults;
                    if (!prev) return [3 /*break*/, 4];
                    hasNewParams = hasDifferentParameterValues(prev, instruction);
                    pending_1 = [];
                    _loop_1 = function (viewPortName) {
                        var _a;
                        var prevViewPortInstruction = prev.viewPortInstructions[viewPortName];
                        var nextViewPortConfig = viewPortName in config.viewPorts
                            ? config.viewPorts[viewPortName]
                            : prevViewPortInstruction;
                        if (nextViewPortConfig.moduleId === null && viewPortName in instruction.router.viewPortDefaults) {
                            nextViewPortConfig = defaults[viewPortName];
                        }
                        var viewPortPlan = viewPortPlans[viewPortName] = {
                            strategy: activationStrategy.noChange,
                            name: viewPortName,
                            config: nextViewPortConfig,
                            prevComponent: prevViewPortInstruction.component,
                        };
                        if ('moduleId' in prevViewPortInstruction) {
                            viewPortPlan.prevModuleId = prevViewPortInstruction.moduleId;
                        }
                        else if ('viewModel' in prevViewPortInstruction) {
                            viewPortPlan.prevViewModel = prevViewPortInstruction.viewModel;
                        }
                        else {
                            throw new Error('Invalid previous viewport instruction.');
                        }
                        if (prevViewPortInstruction.moduleId !== nextViewPortConfig.moduleId) {
                            viewPortPlan.strategy = activationStrategy.replace;
                        }
                        else if ('determineActivationStrategy' in prevViewPortInstruction.component.viewModel) {
                            viewPortPlan.strategy = (_a = prevViewPortInstruction.component.viewModel).determineActivationStrategy.apply(_a, instruction.lifecycleArgs);
                        }
                        else if (config.activationStrategy) {
                            viewPortPlan.strategy = config.activationStrategy;
                        }
                        else if (hasNewParams || forceLifecycleMinimum) {
                            viewPortPlan.strategy = activationStrategy.invokeLifecycle;
                        }
                        else {
                            viewPortPlan.strategy = activationStrategy.noChange;
                        }
                        if (viewPortPlan.strategy !== activationStrategy.replace && prevViewPortInstruction.childRouter) {
                            var path = instruction.getWildcardPath();
                            var task = prevViewPortInstruction
                                .childRouter
                                ._createNavigationInstruction(path, instruction)
                                .then(function (childNavInstruction) { return __awaiter(_this, void 0, void 0, function () {
                                var childPlanOrRedirect;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            viewPortPlan.childNavigationInstruction = childNavInstruction;
                                            return [4 /*yield*/, _buildNavigationPlan(childNavInstruction, viewPortPlan.strategy === activationStrategy.invokeLifecycle)];
                                        case 1:
                                            childPlanOrRedirect = _a.sent();
                                            if (childPlanOrRedirect instanceof Redirect) {
                                                return [2 /*return*/, Promise.reject(childPlanOrRedirect)];
                                            }
                                            childNavInstruction.plans = childPlanOrRedirect;
                                            // for bluebird ?
                                            return [2 /*return*/, null];
                                    }
                                });
                            }); });
                            pending_1.push(task);
                        }
                    };
                    for (viewPortName in prev.viewPortInstructions) {
                        _loop_1(viewPortName);
                    }
                    return [4 /*yield*/, Promise.all(pending_1)];
                case 3:
                    _a.sent();
                    return [2 /*return*/, viewPortPlans];
                case 4:
                    for (viewPortName in config.viewPorts) {
                        viewPortConfig = config.viewPorts[viewPortName];
                        if (viewPortConfig.moduleId === null && viewPortName in instruction.router.viewPortDefaults) {
                            viewPortConfig = defaults[viewPortName];
                        }
                        viewPortPlans[viewPortName] = {
                            name: viewPortName,
                            strategy: activationStrategy.replace,
                            config: viewPortConfig
                        };
                    }
                    return [2 /*return*/, Promise.resolve(viewPortPlans)];
            }
        });
    });
}
function hasDifferentParameterValues(prev, next) {
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
}

var CanDeactivatePreviousStep = /** @class */ (function () {
    function CanDeactivatePreviousStep() {
    }
    CanDeactivatePreviousStep.prototype.run = function (navigationInstruction, next) {
        return processDeactivatable(navigationInstruction, 'canDeactivate', next);
    };
    return CanDeactivatePreviousStep;
}());
var CanActivateNextStep = /** @class */ (function () {
    function CanActivateNextStep() {
    }
    CanActivateNextStep.prototype.run = function (navigationInstruction, next) {
        return processActivatable(navigationInstruction, 'canActivate', next);
    };
    return CanActivateNextStep;
}());
var DeactivatePreviousStep = /** @class */ (function () {
    function DeactivatePreviousStep() {
    }
    DeactivatePreviousStep.prototype.run = function (navigationInstruction, next) {
        return processDeactivatable(navigationInstruction, 'deactivate', next, true);
    };
    return DeactivatePreviousStep;
}());
var ActivateNextStep = /** @class */ (function () {
    function ActivateNextStep() {
    }
    ActivateNextStep.prototype.run = function (navigationInstruction, next) {
        return processActivatable(navigationInstruction, 'activate', next, true);
    };
    return ActivateNextStep;
}());
/**
 * Recursively find list of deactivate-able view models
 * and invoke the either 'canDeactivate' or 'deactivate' on each
 */
function processDeactivatable(navigationInstruction, callbackName, next, ignoreResult) {
    var plan = navigationInstruction.plans;
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
}
/**
 * Recursively find and returns a list of deactivate-able view models
 */
function findDeactivatable(plan, callbackName, list) {
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
            findDeactivatable(viewPortPlan.childNavigationInstruction.plans, callbackName, list);
        }
    }
    return list;
}
function addPreviousDeactivatable(component, callbackName, list) {
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
}
function processActivatable(navigationInstruction, callbackName, next, ignoreResult) {
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
}
/**
 * Find list of activatable view model and add to list (3rd parameter)
 */
function findActivatable(navigationInstruction, callbackName, list, router) {
    if (list === void 0) { list = []; }
    var plan = navigationInstruction.plans;
    Object
        .keys(plan)
        .forEach(function (viewPortName) {
        var viewPortPlan = plan[viewPortName];
        var viewPortInstruction = navigationInstruction.viewPortInstructions[viewPortName];
        var viewModel = viewPortInstruction.component.viewModel;
        if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle
            || viewPortPlan.strategy === activationStrategy.replace)
            && callbackName in viewModel) {
            list.push({
                viewModel: viewModel,
                lifecycleArgs: viewPortInstruction.lifecycleArgs,
                router: router
            });
        }
        if (viewPortPlan.childNavigationInstruction) {
            findActivatable(viewPortPlan.childNavigationInstruction, callbackName, list, viewPortInstruction.component.childRouter || router);
        }
    });
    return list;
}
function shouldContinue(output, router) {
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
}
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
function processPotential(obj, resolve, reject) {
    if (obj && typeof obj.then === 'function') {
        return Promise.resolve(obj).then(resolve).catch(reject);
    }
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
    try {
        return resolve(obj);
    }
    catch (error) {
        return reject(error);
    }
}

var CommitChangesStep = /** @class */ (function () {
    function CommitChangesStep() {
    }
    CommitChangesStep.prototype.run = function (navigationInstruction, next) {
        return navigationInstruction._commitChanges(true).then(function () {
            navigationInstruction._updateTitle();
            return next();
        });
    };
    return CommitChangesStep;
}());
/**
* Class used to represent an instruction during a navigation.
*/
var NavigationInstruction = /** @class */ (function () {
    function NavigationInstruction(init) {
        /**
        * Navigation plans for view ports
        */
        this.plans = null;
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
        for (var key in this.viewPortInstructions) {
            var childInstruction = this.viewPortInstructions[key].childNavigationInstruction;
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
    NavigationInstruction.prototype.addViewPortInstruction = function (name, instructionOrStrategy, moduleId, component) {
        var config = Object.assign({}, this.lifecycleArgs[1], { currentViewPort: name });
        var viewportInstruction;
        if (typeof instructionOrStrategy === 'string') {
            viewportInstruction = this.viewPortInstructions[name] = {
                name: name,
                strategy: instructionOrStrategy,
                moduleId: moduleId,
                component: component,
                childRouter: component.childRouter,
                lifecycleArgs: [this.lifecycleArgs[0], config, this.lifecycleArgs[2]]
            };
        }
        else {
            viewportInstruction.name = name;
            viewportInstruction.childRouter = component.childRouter;
            viewportInstruction.lifecycleArgs = [this.lifecycleArgs[0], config, this.lifecycleArgs[2]];
        }
        return viewportInstruction;
    };
    /**
    * Gets the name of the route pattern's wildcard parameter, if applicable.
    */
    NavigationInstruction.prototype.getWildCardName = function () {
        var wildcardIndex = this.config.route.lastIndexOf('*');
        return this.config.route.substr(wildcardIndex + 1);
    };
    /**
    * Gets the path and query string created by filling the route
    * pattern's wildcard parameter with the matching param.
    */
    NavigationInstruction.prototype.getWildcardPath = function () {
        var wildcardName = this.getWildCardName();
        var path = this.params[wildcardName] || '';
        if (this.queryString) {
            path += '?' + this.queryString;
        }
        return path;
    };
    /**
    * Gets the instruction's base URL, accounting for wildcard route parameters.
    */
    NavigationInstruction.prototype.getBaseUrl = function () {
        var _this = this;
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
            return encodeURI(fragment);
        }
        var wildcardName = this.getWildCardName();
        var path = this.params[wildcardName] || '';
        if (!path) {
            return encodeURI(fragment);
        }
        return encodeURI(fragment.substr(0, fragment.lastIndexOf(path)));
    };
    /**@internal */
    NavigationInstruction.prototype._commitChanges = function (waitToSwap) {
        var _this = this;
        var router = this.router;
        router.currentInstruction = this;
        if (this.previousInstruction) {
            this.previousInstruction.config.navModel.isActive = false;
        }
        this.config.navModel.isActive = true;
        router.refreshNavigation();
        var loads = [];
        var delaySwaps = [];
        var _loop_1 = function (viewPortName) {
            var viewPortInstruction = this_1.viewPortInstructions[viewPortName];
            var viewPort = router.viewPorts[viewPortName];
            if (!viewPort) {
                throw new Error("There was no router-view found in the view for " + viewPortInstruction.moduleId + ".");
            }
            if (viewPortInstruction.strategy === activationStrategy.replace) {
                if (viewPortInstruction.childNavigationInstruction && viewPortInstruction.childNavigationInstruction.parentCatchHandler) {
                    loads.push(viewPortInstruction.childNavigationInstruction._commitChanges(waitToSwap));
                }
                else {
                    if (waitToSwap) {
                        delaySwaps.push({ viewPort: viewPort, viewPortInstruction: viewPortInstruction });
                    }
                    loads.push(viewPort
                        .process(viewPortInstruction, waitToSwap)
                        .then(function () {
                        if (viewPortInstruction.childNavigationInstruction) {
                            return viewPortInstruction.childNavigationInstruction._commitChanges(waitToSwap);
                        }
                        return Promise.resolve();
                    }));
                }
            }
            else {
                if (viewPortInstruction.childNavigationInstruction) {
                    loads.push(viewPortInstruction.childNavigationInstruction._commitChanges(waitToSwap));
                }
            }
        };
        var this_1 = this;
        for (var viewPortName in this.viewPortInstructions) {
            _loop_1(viewPortName);
        }
        return Promise
            .all(loads)
            .then(function () {
            delaySwaps.forEach(function (x) { return x.viewPort.swap(x.viewPortInstruction); });
            prune(_this);
        });
    };
    /**@internal */
    NavigationInstruction.prototype._updateTitle = function () {
        var title = this._buildTitle(this.router.titleSeparator);
        if (title) {
            this.router.history.setTitle(title);
        }
    };
    /**@internal */
    NavigationInstruction.prototype._buildTitle = function (separator) {
        if (separator === void 0) { separator = ' | '; }
        var title = '';
        var childTitles = [];
        if (this.config.navModel.title) {
            title = this.router.transformTitle(this.config.navModel.title);
        }
        for (var viewPortName in this.viewPortInstructions) {
            var viewPortInstruction = this.viewPortInstructions[viewPortName];
            if (viewPortInstruction.childNavigationInstruction) {
                var childTitle = viewPortInstruction.childNavigationInstruction._buildTitle(separator);
                if (childTitle) {
                    childTitles.push(childTitle);
                }
            }
        }
        if (childTitles.length) {
            title = childTitles.join(separator) + (title ? separator : '') + title;
        }
        if (this.router.title) {
            title += (title ? separator : '') + this.router.transformTitle(this.router.title);
        }
        return title;
    };
    return NavigationInstruction;
}());
function prune(instruction) {
    instruction.previousInstruction = null;
    instruction.plans = null;
}

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
        return this.addPipelineStep('authorize', step);
    };
    /**
    * Adds a step to be run during the [[Router]]'s preActivate pipeline slot.
    *
    * @param step The pipeline step.
    * @chainable
    */
    RouterConfiguration.prototype.addPreActivateStep = function (step) {
        return this.addPipelineStep('preActivate', step);
    };
    /**
    * Adds a step to be run during the [[Router]]'s preRender pipeline slot.
    *
    * @param step The pipeline step.
    * @chainable
    */
    RouterConfiguration.prototype.addPreRenderStep = function (step) {
        return this.addPipelineStep('preRender', step);
    };
    /**
    * Adds a step to be run during the [[Router]]'s postRender pipeline slot.
    *
    * @param step The pipeline step.
    * @chainable
    */
    RouterConfiguration.prototype.addPostRenderStep = function (step) {
        return this.addPipelineStep('postRender', step);
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
        if (Array.isArray(route)) {
            route.forEach(this.map.bind(this));
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
        if (this.title) {
            router.title = this.title;
        }
        if (this.titleSeparator) {
            router.titleSeparator = this.titleSeparator;
        }
        if (this.unknownRouteConfig) {
            router.handleUnknownRoutes(this.unknownRouteConfig);
        }
        if (this._fallbackRoute) {
            router.fallbackRoute = this._fallbackRoute;
        }
        if (this.viewPortDefaults) {
            router.useViewPortDefaults(this.viewPortDefaults);
        }
        Object.assign(router.options, this.options);
        var pipelineSteps = this.pipelineSteps;
        if (pipelineSteps.length) {
            if (!router.isRoot) {
                throw new Error('Pipeline steps can only be added to the root router');
            }
            var pipelineProvider = router.pipelineProvider;
            for (var i = 0, ii = pipelineSteps.length; i < ii; ++i) {
                var _a = pipelineSteps[i], name_1 = _a.name, step = _a.step;
                pipelineProvider.addStep(name_1, step);
            }
        }
    };
    return RouterConfiguration;
}());

/**
* The primary class responsible for handling routing and navigation.
*
* @class Router
* @constructor
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
    Router.prototype.generate = function (name, params, options) {
        if (options === void 0) { options = {}; }
        var hasRoute = this._recognizer.hasRoute(name);
        if ((!this.isConfigured || !hasRoute) && this.parent) {
            return this.parent.generate(name, params, options);
        }
        if (!hasRoute) {
            throw new Error("A route with name '" + name + "' could not be found. Check that `name: '" + name + "'` was specified in the route's config.");
        }
        var path = this._recognizer.generate(name, params);
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
            routeConfigs.forEach(this.addRoute.bind(this));
            return;
        }
        validateRouteConfig(config, this.routes);
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
        if ((navModel.order || navModel.order === 0) && this.navigation.indexOf(navModel) === -1) {
            if ((!navModel.href && navModel.href !== '') && (state.types.dynamics || state.types.stars)) {
                throw new Error('Invalid route config for "' + config.route + '" : dynamic routes must specify an "href:" to be included in the navigation model.');
            }
            if (typeof navModel.order !== 'number') {
                navModel.order = ++this._fallbackOrder;
            }
            this.navigation.push(navModel);
            // this is a potential error / inconsistency between browsers
            this.navigation = this.navigation.sort(function (a, b) { return a.order - b.order; });
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
        if (this.parent) {
            return this.parent.updateTitle();
        }
        if (this.currentInstruction) {
            this.currentInstruction._updateTitle();
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
    Router.prototype.useViewPortDefaults = function (viewPortDefaults) {
        for (var viewPortName in viewPortDefaults) {
            var viewPortConfig = viewPortDefaults[viewPortName];
            this.viewPortDefaults[viewPortName] = {
                moduleId: viewPortConfig.moduleId
            };
        }
    };
    /**@internal */
    Router.prototype._refreshBaseUrl = function () {
        if (this.parent) {
            this.baseUrl = generateBaseUrl(this.parent, this.parent.currentInstruction);
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
        return Promise.resolve(config)
            .then(function (c) {
            if (typeof c === 'string') {
                return { moduleId: c };
            }
            else if (typeof c === 'function') {
                return c(instruction);
            }
            return c;
        })
            .then(function (c) { return typeof c === 'string' ? { moduleId: c } : c; })
            .then(function (c) {
            c.route = instruction.params.path;
            validateRouteConfig(c, _this.routes);
            if (!c.navModel) {
                c.navModel = _this.createNavModel(c);
            }
            return c;
        });
    };
    return Router;
}());
function generateBaseUrl(router, instruction) {
    return "" + (router.baseUrl || '') + (instruction.getBaseUrl() || '');
}
function validateRouteConfig(config, routes) {
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

/**
* The status of a Pipeline.
*/
var pipelineStatus = {
    completed: 'completed',
    canceled: 'canceled',
    rejected: 'rejected',
    running: 'running'
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
        // This situation is a bit unfortunate where there is an implicit conversion of any incoming step to a fn
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
        var index = -1;
        var steps = this.steps;
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
        next.complete = createCompletionHandler(next, pipelineStatus.completed);
        next.cancel = createCompletionHandler(next, pipelineStatus.canceled);
        next.reject = createCompletionHandler(next, pipelineStatus.rejected);
        return next();
    };
    return Pipeline;
}());
function createCompletionHandler(next, status) {
    return function (output) {
        return Promise.resolve({ status: status, output: output, completed: status === pipelineStatus.completed });
    };
}

var RouteLoader = /** @class */ (function () {
    function RouteLoader() {
    }
    RouteLoader.prototype.loadRoute = function (router, config, navigationInstruction) {
        throw Error('Route loaders must implement "loadRoute(router, config, navigationInstruction)".');
    };
    return RouteLoader;
}());
var LoadRouteStep = /** @class */ (function () {
    function LoadRouteStep(routeLoader) {
        this.routeLoader = routeLoader;
    }
    /**@internal */
    LoadRouteStep.inject = function () { return [RouteLoader]; };
    LoadRouteStep.prototype.run = function (navigationInstruction, next) {
        return loadNewRoute(this.routeLoader, navigationInstruction)
            .then(next)
            .catch(next.cancel);
    };
    return LoadRouteStep;
}());
function loadNewRoute(routeLoader, navigationInstruction) {
    var toLoad = determineWhatToLoad(navigationInstruction);
    var loadPromises = toLoad.map(function (loadingPlan) { return loadRoute(routeLoader, loadingPlan.navigationInstruction, loadingPlan.viewPortPlan); });
    return Promise.all(loadPromises);
}
/**
 * Determine what are needed to be loaded based on navigation instruction's plan
 * All determined loading plans will be added to 2nd parameter array
 * @param navigationInstruction
 * @param toLoad
 */
function determineWhatToLoad(navigationInstruction, toLoad) {
    if (toLoad === void 0) { toLoad = []; }
    var plans = navigationInstruction.plans;
    for (var viewPortName in plans) {
        var viewPortPlan = plans[viewPortName];
        if (viewPortPlan.strategy === activationStrategy.replace) {
            toLoad.push({ viewPortPlan: viewPortPlan, navigationInstruction: navigationInstruction });
            if (viewPortPlan.childNavigationInstruction) {
                determineWhatToLoad(viewPortPlan.childNavigationInstruction, toLoad);
            }
        }
        else {
            var viewPortInstruction = navigationInstruction.addViewPortInstruction(viewPortName, viewPortPlan.strategy, viewPortPlan.prevModuleId, viewPortPlan.prevComponent);
            if (viewPortPlan.childNavigationInstruction) {
                viewPortInstruction.childNavigationInstruction = viewPortPlan.childNavigationInstruction;
                determineWhatToLoad(viewPortPlan.childNavigationInstruction, toLoad);
            }
        }
    }
    return toLoad;
}
function loadRoute(routeLoader, navigationInstruction, viewPortPlan) {
    return __awaiter(this, void 0, void 0, function () {
        var config, moduleId, viewModel, component, viewPortInstruction, childRouter, path, childInstruction, childPlan;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    config = viewPortPlan.config;
                    moduleId = null;
                    viewModel = null;
                    if (config) {
                        if ('moduleId' in config) {
                            moduleId = config.moduleId;
                        }
                        if ('viewModel' in config) {
                            viewModel = config.viewModel;
                        }
                    }
                    return [4 /*yield*/, loadComponent(routeLoader, navigationInstruction, viewPortPlan.config)];
                case 1:
                    component = _a.sent();
                    viewPortInstruction = navigationInstruction.addViewPortInstruction(viewPortPlan.name, 
                    // Missing lifecycleArgs property
                    {
                        strategy: viewPortPlan.strategy,
                        moduleId: moduleId,
                        viewModel: viewModel,
                        component: component,
                    });
                    childRouter = component.childRouter;
                    if (!childRouter) return [3 /*break*/, 4];
                    path = navigationInstruction.getWildcardPath();
                    return [4 /*yield*/, childRouter._createNavigationInstruction(path, navigationInstruction)];
                case 2:
                    childInstruction = _a.sent();
                    viewPortPlan.childNavigationInstruction = childInstruction;
                    return [4 /*yield*/, _buildNavigationPlan(childInstruction)];
                case 3:
                    childPlan = _a.sent();
                    if (childPlan instanceof Redirect) {
                        return [2 /*return*/, Promise.reject(childPlan)];
                    }
                    childInstruction.plans = childPlan;
                    viewPortInstruction.childNavigationInstruction = childInstruction;
                    return [2 /*return*/, loadNewRoute(routeLoader, childInstruction)];
                case 4: return [2 /*return*/, undefined];
            }
        });
    });
}
function loadComponent(routeLoader, navigationInstruction, config) {
    return __awaiter(this, void 0, void 0, function () {
        var router, lifecycleArgs, component, viewModel, childContainer, childRouter_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    router = navigationInstruction.router;
                    lifecycleArgs = navigationInstruction.lifecycleArgs;
                    return [4 /*yield*/, routeLoader.loadRoute(router, config, navigationInstruction)];
                case 1:
                    component = _a.sent();
                    viewModel = component.viewModel, childContainer = component.childContainer;
                    component.router = router;
                    component.config = config;
                    if (!('configureRouter' in viewModel)) return [3 /*break*/, 3];
                    childRouter_1 = childContainer.getChildRouter();
                    component.childRouter = childRouter_1;
                    return [4 /*yield*/, childRouter_1.configure(function (c) { return viewModel.configureRouter.apply(viewModel, [c, childRouter_1].concat(lifecycleArgs)); })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, component];
            }
        });
    });
}

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
            this._createPipelineSlot('authorize'),
            CanActivateNextStep,
            this._createPipelineSlot('preActivate', 'modelbind'),
            // NOTE: app state changes start below - point of no return
            DeactivatePreviousStep,
            ActivateNextStep,
            this._createPipelineSlot('preRender', 'precommit'),
            CommitChangesStep,
            this._createPipelineSlot('postRender', 'postcomplete')
        ];
    }
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
            if (!found.steps.includes(step)) { // prevent duplicates
                found.steps.push(step);
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
            slot.steps.splice(slot.steps.indexOf(step), 1);
        }
    };
    /**
     * @internal
     * Clears all steps from a slot in the pipeline
     */
    PipelineProvider.prototype._clearSteps = function (name) {
        var slot = this._findStep(name);
        if (slot) {
            slot.steps = [];
        }
    };
    /**
     * Resets all pipeline slots
     */
    PipelineProvider.prototype.reset = function () {
        this._clearSteps('authorize');
        this._clearSteps('preActivate');
        this._clearSteps('preRender');
        this._clearSteps('postRender');
    };
    /**@internal */
    PipelineProvider.prototype._createPipelineSlot = function (name, alias) {
        return new PipelineSlot(this.container, name, alias);
    };
    return PipelineProvider;
}());

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
    * @param viewPort The viewPort.
    * @param name The name of the viewPort. 'default' if unspecified.
    */
    AppRouter.prototype.registerViewPort = function (viewPort, name) {
        var _this = this;
        _super.prototype.registerViewPort.call(this, viewPort, name);
        if (!this.isActive) {
            var viewModel_1 = this._findViewModel(viewPort);
            if ('configureRouter' in viewModel_1) {
                if (!this.isConfigured) {
                    var resolveConfiguredPromise_1 = this._resolveConfiguredPromise;
                    // tslint:disable-next-line
                    this._resolveConfiguredPromise = function () { };
                    return this
                        .configure(function (config) {
                        viewModel_1.configureRouter(config, _this);
                        return config;
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
        if (instructionCount === void 0) { instructionCount = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var instruction, navtracker, pipeline, result, $result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isNavigating && !instructionCount) {
                            return [2 /*return*/, undefined];
                        }
                        instruction = this._queue.shift();
                        this._queue.length = 0;
                        if (!instruction) {
                            return [2 /*return*/, undefined];
                        }
                        this.isNavigating = true;
                        navtracker = this.history.getState('NavigationTracker');
                        if (!navtracker && !this.currentNavigationTracker) {
                            this.isNavigatingFirst = true;
                            this.isNavigatingNew = true;
                        }
                        else if (!navtracker) {
                            this.isNavigatingNew = true;
                        }
                        else if (!this.currentNavigationTracker) {
                            this.isNavigatingRefresh = true;
                        }
                        else if (this.currentNavigationTracker < navtracker) {
                            this.isNavigatingForward = true;
                        }
                        else if (this.currentNavigationTracker > navtracker) {
                            this.isNavigatingBack = true;
                        }
                        if (!navtracker) {
                            navtracker = Date.now();
                            this.history.setState('NavigationTracker', navtracker);
                        }
                        this.currentNavigationTracker = navtracker;
                        instruction.previousInstruction = this.currentInstruction;
                        if (!instructionCount) {
                            this.events.publish('router:navigation:processing', { instruction: instruction });
                        }
                        else if (instructionCount === this.maxInstructionCount - 1) {
                            logger.error(instructionCount + 1 + " navigation instructions have been attempted without success. Restoring last known good location.");
                            restorePreviousLocation(this);
                            return [2 /*return*/, this._dequeueInstruction(instructionCount + 1)];
                        }
                        else if (instructionCount > this.maxInstructionCount) {
                            throw new Error('Maximum navigation attempts exceeded. Giving up.');
                        }
                        pipeline = this.pipelineProvider.createPipeline(!this.couldDeactivate);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, pipeline.run(instruction)];
                    case 2:
                        $result = _a.sent();
                        return [4 /*yield*/, processResult(instruction, $result, instructionCount, this)];
                    case 3:
                        result = _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        result = { output: error_1 instanceof Error ? error_1 : new Error(error_1) };
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, resolveInstruction(instruction, result, !!instructionCount, this)];
                }
            });
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
function processResult(instruction, result, instructionCount, router) {
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
}
function resolveInstruction(instruction, result, isInnerInstruction, router) {
    instruction.resolve(result);
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
            eventName = 'error';
        }
        else if (!result.completed) {
            eventName = 'canceled';
        }
        else {
            var queryString = instruction.queryString ? ('?' + instruction.queryString) : '';
            router.history.previousLocation = instruction.fragment + queryString;
            eventName = 'success';
        }
        router.events.publish("router:navigation:" + eventName, eventArgs);
        router.events.publish('router:navigation:complete', eventArgs);
    }
    else {
        router.events.publish('router:navigation:child:complete', eventArgs);
    }
    return result;
}
function restorePreviousLocation(router) {
    var previousLocation = router.history.previousLocation;
    if (previousLocation) {
        router.navigate(router.history.previousLocation, { trigger: false, replace: true });
    }
    else if (router.fallbackRoute) {
        router.navigate(router.fallbackRoute, { trigger: true, replace: true });
    }
    else {
        logger.error('Router navigation failed, and no previous location or fallbackRoute could be restored.');
    }
}

exports.ActivateNextStep = ActivateNextStep;
exports.CanActivateNextStep = CanActivateNextStep;
exports.CanDeactivatePreviousStep = CanDeactivatePreviousStep;
exports.DeactivatePreviousStep = DeactivatePreviousStep;
exports.AppRouter = AppRouter;
exports.NavModel = NavModel;
exports.Redirect = Redirect;
exports.RedirectToRoute = RedirectToRoute;
exports.isNavigationCommand = isNavigationCommand;
exports.activationStrategy = activationStrategy;
exports.BuildNavigationPlanStep = BuildNavigationPlanStep;
exports.CommitChangesStep = CommitChangesStep;
exports.NavigationInstruction = NavigationInstruction;
exports.PipelineProvider = PipelineProvider;
exports.Pipeline = Pipeline;
exports.pipelineStatus = pipelineStatus;
exports.RouteLoader = RouteLoader;
exports.LoadRouteStep = LoadRouteStep;
exports.RouterConfiguration = RouterConfiguration;
exports.Router = Router;
