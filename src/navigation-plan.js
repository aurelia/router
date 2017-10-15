import { Redirect } from './navigation-commands';
import { _resolveUrl } from './util';

/**
* The strategy to use when activating modules during navigation.
*/
export const activationStrategy: ActivationStrategy = {
  noChange: 'no-change',
  invokeLifecycle: 'invoke-lifecycle',
  replace: 'replace'
};

export class BuildNavigationPlanStep {
  run(navigationInstruction: NavigationInstruction, next: Function) {
    return _buildNavigationPlan(navigationInstruction)
      .then(plan => {
        navigationInstruction.plan = plan;
        return next();
      }).catch(next.cancel);
  }
}

export function _buildNavigationPlan(instruction: NavigationInstruction, forceLifecycleMinimum): Promise<Object> {
  let config = instruction.config;

  if ('redirect' in config) {
    let redirectLocation = _resolveUrl(config.redirect, getInstructionBaseUrl(instruction));
    if (instruction.queryString) {
      redirectLocation += '?' + instruction.queryString;
    }

    return Promise.reject(new Redirect(redirectLocation));
  }

  let prev = instruction.previousInstruction;
  let plan = {};
  let pending = [];

  let newParams = prev ? hasDifferentParameterValues(prev, instruction) : true;

  let viewPortDefaults = Object.assign({}, instruction.router.viewPortDefaults);

  if (prev && !config.explicitViewPorts) {
    for (let viewPortName in prev.viewPortInstructions) {
      delete viewPortDefaults[viewPortName.split('.')[0]];

      let viewPortPlan = buildViewPortPlan(instruction, instruction.config.viewPorts, forceLifecycleMinimum, newParams, viewPortName, true);
      plan[viewPortPlan.name] = viewPortPlan.plan;
      if (viewPortPlan.task) {
        pending.push(viewPortPlan.task);
      }
    }
  }

  let viewPorts = {};

  if (viewPortDefaults) {
    for (let viewPortName in viewPortDefaults) {
      if (config.viewPorts[viewPortName] === undefined) {
        viewPorts[viewPortName] = viewPortDefaults[viewPortName];
      }
    }
  }

  if (config.viewPorts) {
    for (let viewPortName in config.viewPorts) {
      if (config.viewPorts[viewPortName] !== undefined || !viewPorts[viewPortName]) {
        viewPorts[viewPortName] = config.viewPorts[viewPortName];
      }
    }
  }

  for (let viewPortName in viewPorts) {
    let viewPortPlan = buildViewPortPlan(instruction, viewPorts, forceLifecycleMinimum, newParams, viewPortName, false);
    plan[viewPortPlan.name] = viewPortPlan.plan;
    if (viewPortPlan.task) {
      pending.push(viewPortPlan.task);
    }
  }

  return Promise.all(pending).then(() => plan);
}

function buildViewPortPlan(instruction: NavigationInstruction, viewPorts: any, forceLifecycleMinimum, newParams: boolean, viewPortName: string, previous: boolean) {
  let plan = {};
  let prev = instruction.previousInstruction;
  let config = instruction.config;
  let configViewPortName = viewPortName;
  let prevViewPortInstruction = prev ? prev.viewPortInstructions[viewPortName] : undefined;
  let nextViewPortConfig = !previous ? viewPorts[configViewPortName] : undefined;

  if (config.explicitViewPorts && nextViewPortConfig === undefined) {
    nextViewPortConfig = null;
  }

  plan['name'] = viewPortName;
  let viewPortPlan = plan['plan'] = {
    name: viewPortName
  };
  if (prevViewPortInstruction) {
    viewPortPlan.prevComponent = prevViewPortInstruction.component;
    viewPortPlan.prevModuleId = prevViewPortInstruction.moduleId;
  }
  if (nextViewPortConfig) {
    viewPortPlan.config = nextViewPortConfig;
    viewPortPlan.active = true;
  }
  else {
    viewPortPlan.config = prevViewPortInstruction.config;
  }

  if (!prevViewPortInstruction) {
    viewPortPlan.strategy = activationStrategy.replace;
  } else if (nextViewPortConfig === null) { // null value means deliberately cleared!
    viewPortPlan.strategy = activationStrategy.replace;
  } else if (nextViewPortConfig === undefined) { // undefined (left out in config) means keep same
    viewPortPlan.strategy = activationStrategy.noChange;
  }
  else if (prevViewPortInstruction.moduleId !== nextViewPortConfig.moduleId) {
    viewPortPlan.strategy = activationStrategy.replace;
  } else if ('determineActivationStrategy' in prevViewPortInstruction.component.viewModel) {
    viewPortPlan.strategy = prevViewPortInstruction.component.viewModel
      .determineActivationStrategy(...instruction.lifecycleArgs);
  } else if (config.activationStrategy) {
    viewPortPlan.strategy = config.activationStrategy;
  } else if (newParams || forceLifecycleMinimum) {
    viewPortPlan.strategy = activationStrategy.invokeLifecycle;
  } else {
    viewPortPlan.strategy = activationStrategy.noChange;
  }

  if (viewPortPlan.strategy !== activationStrategy.replace && prevViewPortInstruction.childRouter) {
    let path = instruction.getWildcardPath();
    let task = prevViewPortInstruction.childRouter
      ._createNavigationInstruction(path, instruction).then(childInstruction => { // eslint-disable-line no-loop-func
        viewPortPlan.childNavigationInstruction = childInstruction;

        return _buildNavigationPlan(
          childInstruction,
          viewPortPlan.strategy === activationStrategy.invokeLifecycle)
          .then(childPlan => {
            childInstruction.plan = childPlan;
          });
      });

    plan['task'] = task;
  }

  return plan;
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
