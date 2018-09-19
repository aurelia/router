import {Redirect} from './navigation-commands';
import {_resolveUrl} from './util';

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
        if (plan instanceof Redirect) {
          return next.cancel(plan);
        }
        navigationInstruction.plan = plan;
        return next();
      }).catch(next.cancel);
  }
}

export function _buildNavigationPlan(instruction: NavigationInstruction, forceLifecycleMinimum): Promise<Object> {
  let config = instruction.config;

  if ('redirect' in config) {
    let router = instruction.router;
    return router._createNavigationInstruction(config.redirect)
      .then(newInstruction => {
        let params = {};
        for (let key in newInstruction.params) {
          // If the param on the redirect points to another param, e.g. { route: first/:this, redirect: second/:this }
          let val = newInstruction.params[key];
          if (typeof(val) === 'string' && val[0] === ':') {
            val = val.slice(1);
            // And if that param is found on the original instruction then use it
            if (val in instruction.params) {
              params[key] = instruction.params[val];
            }
          } else {
            params[key] = newInstruction.params[key];
          }
        }
        let redirectLocation = router.generate(newInstruction.config.name, params, instruction.options);

        if (instruction.queryString) {
          redirectLocation += '?' + instruction.queryString;
        }

        return Promise.resolve(new Redirect(redirectLocation));
      });
  }

  let prev = instruction.previousInstruction;
  let plan = {};
  let defaults = instruction.router.viewPortDefaults;

  if (prev) {
    let newParams = hasDifferentParameterValues(prev, instruction);
    let pending = [];

    for (let viewPortName in prev.viewPortInstructions) {
      let prevViewPortInstruction = prev.viewPortInstructions[viewPortName];
      let nextViewPortConfig = viewPortName in config.viewPorts ? config.viewPorts[viewPortName] : prevViewPortInstruction;
      if (nextViewPortConfig.moduleId === null && viewPortName in instruction.router.viewPortDefaults) {
        nextViewPortConfig = defaults[viewPortName];
      }

      let viewPortPlan = plan[viewPortName] = {
        name: viewPortName,
        config: nextViewPortConfig,
        prevComponent: prevViewPortInstruction.component,
        prevModuleId: prevViewPortInstruction.moduleId
      };

      if (prevViewPortInstruction.moduleId !== nextViewPortConfig.moduleId) {
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
                if (childPlan instanceof Redirect) {
                  return Promise.reject(childPlan);
                }
                childInstruction.plan = childPlan;
              });
          });

        pending.push(task);
      }
    }
  }

  if (config.viewPorts) {
    for (let viewPortName in config.viewPorts) {
      if (config.viewPorts[viewPortName] === null || config.viewPorts[viewPortName].moduleId === null) {
        config.viewPorts[viewPortName] = null;
      }
      if (config.viewPorts[viewPortName] !== undefined || !viewPorts[viewPortName]) {
        if (config.stateful || (config.viewPorts[viewPortName] && config.viewPorts[viewPortName].stateful)) {
          config.viewPorts[viewPortName].stateful = true;
          viewPortName = instruction.router._ensureStatefulViewPort(viewPortName, config.viewPorts[viewPortName].moduleId);
        }
        viewPorts[viewPortName] = config.viewPorts[viewPortName.split('.')[0]];
      }
    }
  }

  for (let viewPortName in config.viewPorts) {
    let viewPortConfig = config.viewPorts[viewPortName];
    if (viewPortConfig.moduleId === null && viewPortName in instruction.router.viewPortDefaults) {
      viewPortConfig = defaults[viewPortName];
    }
    plan[viewPortName] = {
      name: viewPortName,
      strategy: activationStrategy.replace,
      config: viewPortConfig
    };
  }

  return Promise.all(pending).then(() => {
    for (let viewPortName in plan) {
      if (viewPortName.indexOf('.') != -1) {
        let shortName = viewPortName.split('.')[0];
        if (!plan[shortName]) {
          plan[shortName] = {
            name: shortName,
            strategy: activationStrategy.replace,
            config: null
          }
        }
      }
    }
    return plan;
  });
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
  if (nextViewPortConfig !== undefined) {
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
  }
  else if (!nextViewPortConfig.stateful && !prevViewPortInstruction.active) {
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
