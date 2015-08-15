import {activationStrategy} from './navigation-plan';
import {isNavigationCommand} from './navigation-commands';
import {processPotential} from './util';

export let affirmations = ['yes', 'ok', 'true'];

export class CanDeactivatePreviousStep {
  run(navigationContext : NavigationContext, next : Function) {
    return processDeactivatable(navigationContext.plan, 'canDeactivate', next);
  }
}

export class CanActivateNextStep {
  run(navigationContext : NavigationContext, next : Function) {
    return processActivatable(navigationContext, 'canActivate', next);
  }
}

export class DeactivatePreviousStep {
  run(navigationContext : NavigationContext, next : Function) {
    return processDeactivatable(navigationContext.plan, 'deactivate', next, true);
  }
}

export class ActivateNextStep {
  run(navigationContext : NavigationContext, next : Function) {
    return processActivatable(navigationContext, 'activate', next, true);
  }
}

function processDeactivatable(plan, callbackName, next, ignoreResult) {
  let infos = findDeactivatable(plan, callbackName),
      i = infos.length; //query from inside out

  function inspect(val) {
    if (ignoreResult || shouldContinue(val)) {
      return iterate();
    } else {
      return next.cancel(val);
    }
  }

  function iterate() {
    if (i--) {
      try {
        let controller = infos[i];
        let result = controller[callbackName]();
        return processPotential(result, inspect, next.cancel);
      } catch(error) {
        return next.cancel(error);
      }
    } else {
      return next();
    }
  }

  return iterate();
}

function findDeactivatable(plan, callbackName, list : Array<Object> = []) : Array<Object> {
  for (let viewPortName in plan) {
    let viewPortPlan = plan[viewPortName];
    let prevComponent = viewPortPlan.prevComponent;

    if ((viewPortPlan.strategy == activationStrategy.invokeLifecycle ||
        viewPortPlan.strategy == activationStrategy.replace) &&
        prevComponent) {

      let controller = prevComponent.bindingContext;

      if (callbackName in controller) {
        list.push(controller);
      }
    }

    if (viewPortPlan.childNavigationContext) {
      findDeactivatable(viewPortPlan.childNavigationContext.plan, callbackName, list);
    } else if (prevComponent) {
      addPreviousDeactivatable(prevComponent, callbackName, list);
    }
  }

  return list;
}

function addPreviousDeactivatable(component, callbackName, list) : void {
  let controller = component.bindingContext,
      childRouter = component.childRouter;

  if (childRouter && childRouter.currentInstruction) {
    let viewPortInstructions = childRouter.currentInstruction.viewPortInstructions;

    for (let viewPortName in viewPortInstructions) {
      let viewPortInstruction = viewPortInstructions[viewPortName];
      let prevComponent = viewPortInstruction.component;
      let prevController = prevComponent.bindingContext;

      if (callbackName in prevController) {
        list.push(prevController);
      }

      addPreviousDeactivatable(prevComponent, callbackName, list);
    }
  }
}

function processActivatable(navigationContext : NavigationContext, callbackName : any, next : Function, ignoreResult : boolean) {
  let infos = findActivatable(navigationContext, callbackName),
      length = infos.length,
      i = -1; //query from top down

  function inspect(val, router) {
    if (ignoreResult || shouldContinue(val, router)) {
      return iterate();
    } else {
      return next.cancel(val);
    }
  }

  function iterate() {
    i++;

    if (i < length) {
      try {
        let current = infos[i];
        let result = current.controller[callbackName](...current.lifecycleArgs);
        return processPotential(result, val => inspect(val, current.router), next.cancel);
      } catch(error) {
        return next.cancel(error);
      }
    } else {
      return next();
    }
  }

  return iterate();
}

function findActivatable(navigationContext : NavigationContext, callbackName : string, list : Array<Object> = [], router : Router) : Array<Object> {
  let plan = navigationContext.plan;
  let next = navigationContext.nextInstruction;

  Object.keys(plan).filter((viewPortName) => {
    let viewPortPlan = plan[viewPortName];
    let viewPortInstruction = next.viewPortInstructions[viewPortName];
    let controller = viewPortInstruction.component.bindingContext;

    if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle || viewPortPlan.strategy === activationStrategy.replace) && callbackName in controller) {
      list.push({
        controller: controller,
        lifecycleArgs: viewPortInstruction.lifecycleArgs,
        router: router
      });
    }

    if (viewPortPlan.childNavigationContext) {
      findActivatable(
        viewPortPlan.childNavigationContext,
        callbackName,
        list,
        viewPortInstruction.component.childRouter || router
      );
    }
  });

  return list;
}

function shouldContinue(output, router : Router) {
  if(output instanceof Error) {
    return false;
  }

  if(isNavigationCommand(output)){
    if(typeof output.setRouter === 'function') {
      output.setRouter(router);
    }

    return !!output.shouldContinueProcessing;
  }

  if(typeof output === 'string') {
    return affirmations.indexOf(output.toLowerCase()) !== -1;
  }

  if(typeof output === 'undefined') {
    return true;
  }

  return output;
}
