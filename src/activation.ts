import { activationStrategy } from './navigation-plan';
import { isNavigationCommand } from './navigation-commands';
import { NavigationInstruction } from './navigation-instruction';
import { Next } from './pipeline';
import { Router } from './router';
import { ViewPortComponent, ViewPortPlan } from './interfaces';

export class CanDeactivatePreviousStep {
  run(navigationInstruction: NavigationInstruction, next: Next) {
    return processDeactivatable(navigationInstruction, 'canDeactivate', next);
  }
}

export class CanActivateNextStep {
  run(navigationInstruction: NavigationInstruction, next: Next) {
    return processActivatable(navigationInstruction, 'canActivate', next);
  }
}

export class DeactivatePreviousStep {
  run(navigationInstruction: NavigationInstruction, next: Next) {
    return processDeactivatable(navigationInstruction, 'deactivate', next, true);
  }
}

export class ActivateNextStep {
  run(navigationInstruction: NavigationInstruction, next: Next) {
    return processActivatable(navigationInstruction, 'activate', next, true);
  }
}

/**
 * Recursively find list of deactivate-able view models
 * and invoke the either 'canDeactivate' or 'deactivate' on each
 */
function processDeactivatable(
  navigationInstruction: NavigationInstruction,
  callbackName: string,
  next: Next,
  ignoreResult?: boolean
): Promise<any> {
  const plan = navigationInstruction.plan;
  let infos = findDeactivatable(plan, callbackName);
  let i = infos.length; // query from inside out

  function inspect(val: any): Promise<any> {
    if (ignoreResult || shouldContinue(val)) {
      return iterate();
    }

    return next.cancel(val);
  }

  function iterate(): Promise<any> {
    if (i--) {
      try {
        let viewModel = infos[i];
        let result = viewModel[callbackName](navigationInstruction);
        return processPotential(result, inspect, next.cancel);
      } catch (error) {
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
function findDeactivatable(
  plan: Record<string, ViewPortPlan>,
  callbackName: string,
  list: IActivatableInfo[] = []
): any[] {
  for (let viewPortName in plan) {
    let viewPortPlan = plan[viewPortName];
    let prevComponent = viewPortPlan.prevComponent;

    if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle || viewPortPlan.strategy === activationStrategy.replace)
      && prevComponent
    ) {
      let viewModel = prevComponent.viewModel;

      if (callbackName in viewModel) {
        list.push(viewModel);
      }
    }

    if (viewPortPlan.strategy === activationStrategy.replace && prevComponent) {
      addPreviousDeactivatable(prevComponent, callbackName, list);
    } else if (viewPortPlan.childNavigationInstruction) {
      findDeactivatable(viewPortPlan.childNavigationInstruction.plan, callbackName, list);
    }
  }

  return list;
}

function addPreviousDeactivatable(component: ViewPortComponent, callbackName: string, list: IActivatableInfo[]): void {
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
}

function processActivatable(
  navigationInstruction: NavigationInstruction,
  callbackName: string,
  next: Next,
  ignoreResult?: boolean
) {
  let infos = findActivatable(navigationInstruction, callbackName);
  let length = infos.length;
  let i = -1; // query from top down

  function inspect(val: any, router: Router): Promise<any> {
    if (ignoreResult || shouldContinue(val, router)) {
      return iterate();
    }

    return next.cancel(val);
  }

  function iterate(): Promise<any> {
    i++;

    if (i < length) {
      try {
        let current = infos[i];
        let result = current.viewModel[callbackName](...current.lifecycleArgs);
        return processPotential(result, (val: any) => inspect(val, current.router), next.cancel);
      } catch (error) {
        return next.cancel(error);
      }
    }

    return next();
  }

  return iterate();
}

interface IActivatableInfo {
  viewModel: any;
  lifecycleArgs: any[];
  router: Router;
}

/**
 * Find list of activatable view model and add to list (3rd parameter)
 */
function findActivatable(
  navigationInstruction: NavigationInstruction,
  callbackName: string,
  list: IActivatableInfo[] = [],
  router?: Router
): IActivatableInfo[] {
  let plan = navigationInstruction.plan;

  Object
    .keys(plan)
    .forEach((viewPortName) => {
      let viewPortPlan = plan[viewPortName];
      let viewPortInstruction = navigationInstruction.viewPortInstructions[viewPortName];
      let viewModel = viewPortInstruction.component.viewModel;

      if (
        (viewPortPlan.strategy === activationStrategy.invokeLifecycle
          || viewPortPlan.strategy === activationStrategy.replace
        )
        && callbackName in viewModel
      ) {
        list.push({
          viewModel,
          lifecycleArgs: viewPortInstruction.lifecycleArgs,
          router
        });
      }

      if (viewPortPlan.childNavigationInstruction) {
        findActivatable(
          viewPortPlan.childNavigationInstruction,
          callbackName,
          list,
          viewPortInstruction.component.childRouter || router
        );
      }
    });

  return list;
}

function shouldContinue(output: any, router?: Router) {
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
interface ISubscription {
  unsubscribe(): void;
}

type SafeSubscriptionFunc = (sub: SafeSubscription) => ISubscription;

/**
 * wraps a subscription, allowing unsubscribe calls even if
 * the first value comes synchronously
 */
class SafeSubscription {

  private _subscribed: boolean;
  private _subscription: ISubscription;

  constructor(subscriptionFunc: SafeSubscriptionFunc) {
    this._subscribed = true;
    this._subscription = subscriptionFunc(this);

    if (!this._subscribed) {
      this.unsubscribe();
    }
  }

  get subscribed(): boolean {
    return this._subscribed;
  }

  unsubscribe(): void {
    if (this._subscribed && this._subscription) {
      this._subscription.unsubscribe();
    }

    this._subscribed = false;
  }
}

function processPotential(obj: any, resolve: (val?: any) => any, reject: (err?: any) => any) {
  if (obj && typeof obj.then === 'function') {
    return Promise.resolve(obj).then(resolve).catch(reject);
  }

  if (obj && typeof obj.subscribe === 'function') {
    let obs: IObservable = obj;
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

  try {
    return resolve(obj);
  } catch (error) {
    return reject(error);
  }
}
