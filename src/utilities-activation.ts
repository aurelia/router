import { Next, ViewPortComponent, ViewPortPlan, ViewPortInstruction, LifecycleArguments } from './interfaces';
import { isNavigationCommand } from './navigation-commands';
import { NavigationInstruction } from './navigation-instruction';
import { activationStrategy } from './activation-strategy';
import { Router } from './router';

/**
 * Recursively find list of deactivate-able view models
 * and invoke the either 'canDeactivate' or 'deactivate' on each
 * @internal exported for unit testing
 */
export const processDeactivatable = (
  navigationInstruction: NavigationInstruction,
  callbackName: 'canDeactivate' | 'deactivate',
  next: Next,
  ignoreResult?: boolean
): Promise<any> => {
  let plan: Record<string, ViewPortPlan> = navigationInstruction.plan;
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
};

/**
 * Recursively find and returns a list of deactivate-able view models
 * @internal exported for unit testing
 */
export const findDeactivatable = (
  plan: Record<string, ViewPortPlan>,
  callbackName: string,
  list: IActivatableInfo[] = []
): any[] => {
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
};

/**
 * @internal exported for unit testing
 */
export const addPreviousDeactivatable = (
  component: ViewPortComponent,
  callbackName: string,
  list: IActivatableInfo[]
): void => {
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
export const processActivatable = (
  navigationInstruction: NavigationInstruction,
  callbackName: 'canActivate' | 'activate',
  next: Next,
  ignoreResult?: boolean
): Promise<any> => {
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
};

interface IActivatableInfo {
  viewModel: any;
  lifecycleArgs: LifecycleArguments;
  router: Router;
}

/**
 * Find list of activatable view model and add to list (3rd parameter)
 * @internal exported for unit testing
 */
export const findActivatable = (
  navigationInstruction: NavigationInstruction,
  callbackName: 'canActivate' | 'activate',
  list: IActivatableInfo[] = [],
  router?: Router
): IActivatableInfo[] => {
  let plan: Record<string, ViewPortPlan> = navigationInstruction.plan;

  Object
    .keys(plan)
    .forEach((viewPortName) => {
      let viewPortPlan = plan[viewPortName];
      let viewPortInstruction = navigationInstruction.viewPortInstructions[viewPortName] as ViewPortInstruction;
      let viewPortComponent = viewPortInstruction.component;
      let viewModel = viewPortComponent.viewModel;

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

      let childNavInstruction = viewPortPlan.childNavigationInstruction;

      if (childNavInstruction) {
        findActivatable(
          childNavInstruction,
          callbackName,
          list,
          viewPortComponent.childRouter || router
        );
      }
    });

  return list;
};

const shouldContinue = <T = any>(output: T, router?: Router): boolean | T => {
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

/**
 * A function to process return value from `activate`/`canActivate` steps
 * Supports observable/promise
 *
 * For observable, resolve at first next() or on complete()
 */
const processPotential = (obj: any, resolve: (val?: any) => any, reject: (err?: any) => any): any => {
  // if promise like
  if (obj && typeof obj.then === 'function') {
    return Promise.resolve(obj).then(resolve).catch(reject);
  }

  // if observable
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

  // else just resolve
  try {
    return resolve(obj);
  } catch (error) {
    return reject(error);
  }
};
