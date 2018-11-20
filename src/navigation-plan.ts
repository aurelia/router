import { Redirect } from './navigation-commands';
import { NavigationInstruction } from './navigation-instruction';
import { ActivationStrategy, ViewPortPlan } from './interfaces';
import { Next } from './pipeline';

/**
* The strategy to use when activating modules during navigation.
*/
export const activationStrategy: ActivationStrategy = {
  noChange: 'no-change',
  invokeLifecycle: 'invoke-lifecycle',
  replace: 'replace'
};

export class BuildNavigationPlanStep {
  run(navigationInstruction: NavigationInstruction, next: Next) {
    return _buildNavigationPlan(navigationInstruction)
      .then(plan => {
        if (plan instanceof Redirect) {
          return next.cancel(plan);
        }
        navigationInstruction.plan = plan;
        return next();
      })
      .catch(next.cancel);
  }
}

export function _buildNavigationPlan(
  instruction: NavigationInstruction,
  forceLifecycleMinimum?: boolean
): Promise<Record<string, ViewPortPlan> | Redirect> {
  let config = instruction.config;

  if ('redirect' in config) {
    const router = instruction.router;
    return router
      ._createNavigationInstruction(config.redirect)
      .then(newInstruction => {
        const params: Record<string, any> = {};
        for (let key in newInstruction.params) {
          // If the param on the redirect points to another param, e.g. { route: first/:this, redirect: second/:this }
          let val = newInstruction.params[key];
          if (typeof val === 'string' && val[0] === ':') {
            val = val.slice(1);
            // And if that param is found on the original instruction then use it
            if (val in instruction.params) {
              params[key] = instruction.params[val];
            }
          } else {
            params[key] = newInstruction.params[key];
          }
        }
        let redirectLocation = router.generate(newInstruction.config, params, instruction.options);

        // Special handling for child routes
        for (let key in instruction.params) {
          redirectLocation = redirectLocation.replace(`:${key}`, instruction.params[key]);
        }

        if (instruction.queryString) {
          redirectLocation += '?' + instruction.queryString;
        }

        return Promise.resolve(new Redirect(redirectLocation));
      });
  }

  const prev = instruction.previousInstruction;
  const plan: Record<string, ViewPortPlan> = {};
  const defaults = instruction.router.viewPortDefaults;

  if (prev) {
    let newParams = hasDifferentParameterValues(prev, instruction);
    let pending: Promise<void>[] = [];

    for (let viewPortName in prev.viewPortInstructions) {
      const prevViewPortInstruction = prev.viewPortInstructions[viewPortName];
      let nextViewPortConfig = viewPortName in config.viewPorts ? config.viewPorts[viewPortName] : prevViewPortInstruction;
      if (nextViewPortConfig.moduleId === null && viewPortName in instruction.router.viewPortDefaults) {
        nextViewPortConfig = defaults[viewPortName];
      }

      const viewPortPlan = plan[viewPortName] = {
        name: viewPortName,
        config: nextViewPortConfig,
        prevComponent: prevViewPortInstruction.component,
        prevModuleId: prevViewPortInstruction.moduleId
      } as ViewPortPlan;

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
        const path = instruction.getWildcardPath();
        const task: Promise<void> = prevViewPortInstruction
          .childRouter
          ._createNavigationInstruction(path, instruction)
          .then(childInstruction => {
            viewPortPlan.childNavigationInstruction = childInstruction;

            return _buildNavigationPlan(
              childInstruction,
              viewPortPlan.strategy === activationStrategy.invokeLifecycle
            )
              .then(childPlan => {
                if (childPlan instanceof Redirect) {
                  return Promise.reject(childPlan);
                }
                childInstruction.plan = childPlan;
                // for bluebird ?
                return null;
              });
          });

        pending.push(task);
      }
    }

    return Promise.all(pending).then(() => plan);
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

  return Promise.resolve(plan);
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
