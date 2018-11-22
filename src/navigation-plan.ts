import { Redirect } from './navigation-commands';
import { NavigationInstruction } from './navigation-instruction';
import { ActivationStrategy, ViewPortPlan, RouteConfig } from './interfaces';
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
        navigationInstruction.plans = plan;
        return next();
      })
      .catch(next.cancel);
  }
}

export async function _buildNavigationPlan(
  instruction: NavigationInstruction,
  forceLifecycleMinimum?: boolean
): Promise<Record<string, ViewPortPlan> | Redirect> {
  let config = instruction.config;

  if ('redirect' in config) {
    const router = instruction.router;
    const newInstruction = await router._createNavigationInstruction(config.redirect);
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
    let redirectLocation = router.generate(newInstruction.config.name, params, instruction.options);
    if (instruction.queryString) {
      redirectLocation += '?' + instruction.queryString;
    }
    return new Redirect(redirectLocation);
  }

  const prev = instruction.previousInstruction;
  const viewPortPlans: Record<string, ViewPortPlan> = {};
  const defaults = instruction.router.viewPortDefaults;

  if (prev) {
    let hasNewParams = hasDifferentParameterValues(prev, instruction);
    let pending: Promise<void>[] = [];

    for (let viewPortName in prev.viewPortInstructions) {
      const prevViewPortInstruction = prev.viewPortInstructions[viewPortName];
      let nextViewPortConfig: RouteConfig = viewPortName in config.viewPorts
        ? config.viewPorts[viewPortName]
        : prevViewPortInstruction;
      if (nextViewPortConfig.moduleId === null && viewPortName in instruction.router.viewPortDefaults) {
        nextViewPortConfig = defaults[viewPortName] as RouteConfig;
      }

      const viewPortPlan = viewPortPlans[viewPortName] = {
        strategy: activationStrategy.noChange,
        name: viewPortName,
        config: nextViewPortConfig as RouteConfig,
        prevComponent: prevViewPortInstruction.component,
        // prevModuleId: prevViewPortInstruction.moduleId
      } as ViewPortPlan;

      if ('moduleId' in prevViewPortInstruction) {
        viewPortPlan.prevModuleId = prevViewPortInstruction.moduleId;
        if ('moduleId' in nextViewPortConfig) {

        } else {

        }
      } else if ('viewModel' in prevViewPortInstruction) {
        viewPortPlan.prevViewModel = prevViewPortInstruction.viewModel;
      } else {
        throw new Error('Invalid previous viewport instruction.');
      }

      if (prevViewPortInstruction.moduleId !== nextViewPortConfig.moduleId) {
        viewPortPlan.strategy = activationStrategy.replace;
      } else if ('determineActivationStrategy' in prevViewPortInstruction.component.viewModel) {
        viewPortPlan.strategy = prevViewPortInstruction.component.viewModel
          .determineActivationStrategy(...instruction.lifecycleArgs);
      } else if (config.activationStrategy) {
        viewPortPlan.strategy = config.activationStrategy;
      } else if (hasNewParams || forceLifecycleMinimum) {
        viewPortPlan.strategy = activationStrategy.invokeLifecycle;
      } else {
        viewPortPlan.strategy = activationStrategy.noChange;
      }

      if (viewPortPlan.strategy !== activationStrategy.replace && prevViewPortInstruction.childRouter) {
        const path = instruction.getWildcardPath();
        const task: Promise<void> = prevViewPortInstruction
          .childRouter
          ._createNavigationInstruction(path, instruction)
          .then(async childNavInstruction => {
            viewPortPlan.childNavigationInstruction = childNavInstruction;

            const childPlanOrRedirect = await _buildNavigationPlan(
              childNavInstruction,
              viewPortPlan.strategy === activationStrategy.invokeLifecycle
            );
            if (childPlanOrRedirect instanceof Redirect) {
              return Promise.reject(childPlanOrRedirect);
            }
            childNavInstruction.plans = childPlanOrRedirect;
            // for bluebird ?
            return null;
          });

        pending.push(task);
      }
    }

    await Promise.all(pending);
    return viewPortPlans;
  }

  for (let viewPortName in config.viewPorts) {
    let viewPortConfig = config.viewPorts[viewPortName];
    if (viewPortConfig.moduleId === null && viewPortName in instruction.router.viewPortDefaults) {
      viewPortConfig = defaults[viewPortName];
    }
    viewPortPlans[viewPortName] = {
      name: viewPortName,
      strategy: activationStrategy.replace,
      config: viewPortConfig
    };
  }

  return Promise.resolve(viewPortPlans);
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

function areViewModelDifferent() {

}
