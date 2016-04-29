import {activationStrategy} from './navigation-plan';
import {isNavigationCommand} from './navigation-commands';

export class CanDeactivatePreviousStep {
  run(navigationInstruction: NavigationInstruction, next: Function) {
    return processDeactivatable(navigationInstruction.plan, 'canDeactivate', next);
  }
}

export class CanActivateNextStep {
  run(navigationInstruction: NavigationInstruction, next: Function) {
    return processActivatable(navigationInstruction, 'canActivate', next);
  }
}

export class DeactivatePreviousStep {
  run(navigationInstruction: NavigationInstruction, next: Function) {
    return processDeactivatable(navigationInstruction.plan, 'deactivate', next, true);
  }
}

export class ActivateNextStep {
  run(navigationInstruction: NavigationInstruction, next: Function) {
    return processActivatable(navigationInstruction, 'activate', next, true);
  }
}

function processDeactivatable(plan, callbackName, next, ignoreResult) {
  let infos = findDeactivatable(plan, callbackName);
  let i = infos.length; //query from inside out

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
        let result = viewModel[callbackName]();
        return processPotential(result, inspect, next.cancel);
      } catch (error) {
        return next.cancel(error);
      }
    }

    return next();
  }

  return iterate();
}

function findDeactivatable(plan, callbackName, list: Array<Object> = []): Array<Object> {
  for (let viewPortName in plan) {
    let viewPortPlan = plan[viewPortName];
    let prevComponent = viewPortPlan.prevComponent;

    if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle ||
        viewPortPlan.strategy === activationStrategy.replace) &&
        prevComponent) {
      let viewModel = prevComponent.viewModel;

      if (callbackName in viewModel) {
        list.push(viewModel);
      }
    }

    if (viewPortPlan.childNavigationInstruction) {
      findDeactivatable(viewPortPlan.childNavigationInstruction.plan, callbackName, list);
    } else if (prevComponent) {
      addPreviousDeactivatable(prevComponent, callbackName, list);
    }
  }

  return list;
}

function addPreviousDeactivatable(component, callbackName, list): void {
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

function processActivatable(navigationInstruction: NavigationInstruction, callbackName: any, next: Function, ignoreResult: boolean) {
  let infos = findActivatable(navigationInstruction, callbackName);
  let length = infos.length;
  let i = -1; //query from top down

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
        return processPotential(result, val => inspect(val, current.router), next.cancel);
      } catch (error) {
        return next.cancel(error);
      }
    }

    return next();
  }

  return iterate();
}

function findActivatable(navigationInstruction: NavigationInstruction, callbackName: string, list: Array<Object> = [], router: Router): Array<Object> {
  let plan = navigationInstruction.plan;

  Object.keys(plan).filter((viewPortName) => {
    let viewPortPlan = plan[viewPortName];
    let viewPortInstruction = navigationInstruction.viewPortInstructions[viewPortName];
    let viewModel = viewPortInstruction.component.viewModel;

    if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle || viewPortPlan.strategy === activationStrategy.replace) && callbackName in viewModel) {
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

function shouldContinue(output, router: Router) {
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

class SafeSubscription {
  //if this were TypeScript, subscriptionFunc would be of type 
  //(sub: SafeSubscription) => Subscription
  constructor(subscriptionFunc) {
    this._subscribed = true;
    this._subscription = subscriptionFunc(this);
    
    if(!this._subscribed) this.unsubscribe()
  }
  
  unsubscribe() {
    if(this._subscription) this._subscription.unsubscribe();
    
    this._subscribed = false;
  }
}

function processPotential(obj, resolve, reject) {
  if (obj && typeof obj.then === 'function') {
    return Promise.resolve(obj).then(resolve).catch(reject);
  }
  
  if(obj && typeof obj.subscribe === 'function') {
    //an object with a subscribe function should be assumed to be an observable
    new SafeSubscription(sub => obj.subscribe({
      next() {
        sub.unsubscribe();
        resolve(obj);
      },
      error(err) {
        reject(err);
      }
    }));
  }

  try {
    return resolve(obj);
  } catch (error) {
    return reject(error);
  }
}
