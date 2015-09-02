import {Redirect} from './navigation-commands';
import {resolveUrl} from './util';

export const activationStrategy = {
  noChange: 'no-change',
  invokeLifecycle: 'invoke-lifecycle',
  replace: 'replace'
};

export function buildNavigationPlan(navigationContext: NavigationContext, forceLifecycleMinimum): Promise<Object> {
  let prev = navigationContext.prevInstruction;
  let next = navigationContext.nextInstruction;
  let plan = {};

  if ('redirect' in next.config) {
    let redirectLocation = resolveUrl(next.config.redirect, getInstructionBaseUrl(next));
    if (next.queryString) {
      redirectLocation += '?' + next.queryString;
    }

    return Promise.reject(new Redirect(redirectLocation));
  }

  if (prev) {
    let newParams = hasDifferentParameterValues(prev, next);
    let pending = [];

    for (let viewPortName in prev.viewPortInstructions) {
      let prevViewPortInstruction = prev.viewPortInstructions[viewPortName];
      let nextViewPortConfig = next.config.viewPorts[viewPortName];
      let viewPortPlan = plan[viewPortName] = {
        name: viewPortName,
        config: nextViewPortConfig,
        prevComponent: prevViewPortInstruction.component,
        prevModuleId: prevViewPortInstruction.moduleId
      };

      if (prevViewPortInstruction.moduleId !== nextViewPortConfig.moduleId) {
        viewPortPlan.strategy = activationStrategy.replace;
      } else if ('determineActivationStrategy' in prevViewPortInstruction.component.bindingContext) {
         //TODO: should we tell them if the parent had a lifecycle min change?
        viewPortPlan.strategy = prevViewPortInstruction.component.bindingContext
          .determineActivationStrategy(...next.lifecycleArgs);
      } else if (next.config.activationStrategy) {
        viewPortPlan.strategy = next.config.activationStrategy;
      } else if (newParams || forceLifecycleMinimum) {
        viewPortPlan.strategy = activationStrategy.invokeLifecycle;
      } else {
        viewPortPlan.strategy = activationStrategy.noChange;
      }

      if (viewPortPlan.strategy !== activationStrategy.replace && prevViewPortInstruction.childRouter) {
        let path = next.getWildcardPath();
        let task = prevViewPortInstruction.childRouter
          .createNavigationInstruction(path, next).then(childInstruction => { // eslint-disable-line no-loop-func
            viewPortPlan.childNavigationContext = prevViewPortInstruction.childRouter
              .createNavigationContext(childInstruction);

            return buildNavigationPlan(
              viewPortPlan.childNavigationContext,
              viewPortPlan.strategy === activationStrategy.invokeLifecycle)
              .then(childPlan => {
                viewPortPlan.childNavigationContext.plan = childPlan;
              });
          });

        pending.push(task);
      }
    }

    return Promise.all(pending).then(() => plan);
  }

  for (let viewPortName in next.config.viewPorts) {
    plan[viewPortName] = {
      name: viewPortName,
      strategy: activationStrategy.replace,
      config: next.config.viewPorts[viewPortName]
    };
  }

  return Promise.resolve(plan);
}

export class BuildNavigationPlanStep {
  run(navigationContext: NavigationContext, next: Function) {
    return buildNavigationPlan(navigationContext)
      .then(plan => {
        navigationContext.plan = plan;
        return next();
      }).catch(next.cancel);
  }
}

function hasDifferentParameterValues(prev: NavigationInstruction, next: NavigationInstruction): boolean {
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

  return false;
}

function getInstructionBaseUrl(instruction: NavigationInstruction): string {
  let instructionBaseUrlParts = [];
  instruction = instruction.parentInstruction;

  while (instruction) {
    instructionBaseUrlParts.unshift(instruction.getBaseUrl());
    instruction = instruction.parentInstruction;
  }

  instructionBaseUrlParts.unshift('/');
  return instructionBaseUrlParts.join('');
}
