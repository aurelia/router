import { ActivationStrategy, Next, RouteConfig, ViewPortPlan, ViewPortInstruction } from './interfaces';
import { Redirect } from './navigation-commands';
import { NavigationInstruction } from './navigation-instruction';
import { resolveViewModel } from './resolve-view-model';
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
  run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {
    return _buildNavigationPlan(navigationInstruction)
      .then(plans => {
        if (plans instanceof Redirect) {
          return next.cancel(plans);
        }
        navigationInstruction.plan = plans;
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
    return _buildRedirect(instruction);
  }

  if (instruction.previousInstruction) {
    return _buildTransitionPlans(instruction, forceLifecycleMinimum);
  }

  // First navigation
  // Only needs to process current instruction without considering transition from previous instruction
  const viewPortPlans: Record<string, ViewPortPlan> = {};
  const defaultViewPorts = instruction.router.viewPortDefaults;
  for (let viewPortName in config.viewPorts) {
    let viewPortConfig = config.viewPorts[viewPortName];
    if (viewPortConfig.moduleId === null && viewPortName in instruction.router.viewPortDefaults) {
      viewPortConfig = defaultViewPorts[viewPortName];
    }
    viewPortPlans[viewPortName] = {
      name: viewPortName,
      strategy: activationStrategy.replace,
      config: viewPortConfig
    };
  }

  return Promise.resolve(viewPortPlans);
}

/**@internal exported for unit testing */
export async function _buildRedirect(instruction: NavigationInstruction): Promise<Redirect> {
  let redirectLocation: string;
  const config = instruction.config;
  // if ('name' in config) {
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
  redirectLocation = router.generate(newInstruction.config.name, params, instruction.options);
  // Special handling for child routes
  for (let key in instruction.params) {
    redirectLocation = redirectLocation.replace(`:${key}`, instruction.params[key]);
  }
  // } else {
  // redirectLocation = _resolveUrl(config.redirect, getInstructionBaseUrl(instruction));
  // }
  if (instruction.queryString) {
    redirectLocation += '?' + instruction.queryString;
  }
  return new Redirect(redirectLocation);
}

/**
 * @internal Exported for unit testing
 *
 * Build a record of viewport plans to describe instruction when navigating to a new route
 */
export async function _buildTransitionPlans(
  instruction: NavigationInstruction,
  forceLifecycleMinimum?: boolean
): Promise<Record<string, ViewPortPlan>> {
  let config = instruction.config;
  let prev = instruction.previousInstruction;
  let defaults = instruction.router.viewPortDefaults;
  let hasNewParams = hasDifferentParameterValues(prev, instruction);
  let pending: Promise<void>[] = [];
  let viewPortPlans: Record<string, ViewPortPlan> = {};

  for (let viewPortName in prev.viewPortInstructions) {
    const prevViewPortInstruction = prev.viewPortInstructions[viewPortName];
    let nextViewPortConfig: RouteConfig = viewPortName in config.viewPorts
      ? config.viewPorts[viewPortName]
      : prevViewPortInstruction;

    if (nextViewPortConfig.moduleId === null && viewPortName in instruction.router.viewPortDefaults) {
      nextViewPortConfig = defaults[viewPortName] as RouteConfig;
    }

    // Cannot simply do an equality comparison as user may have code like this:
    // { route: 'a', viewModel: () => import('a') }
    // { route: 'b', viewModel: () => import('a') }
    // the two viewModel factories are different, but they are expected to be the same
    // as they points to the same default export from module 'a'
    let prevViewModelTarget: string | Function | null = await resolveViewModel(prevViewPortInstruction);
    let nextViewModelTarget: string | Function | null = await resolveViewModel(nextViewPortConfig);

    const viewPortPlan = viewPortPlans[viewPortName] = {
      strategy: activationStrategy.noChange,
      name: viewPortName,
      config: nextViewPortConfig as RouteConfig,
      prevComponent: prevViewPortInstruction.component,
      prevModuleId: prevViewModelTarget,
      prevViewModel: prevViewModelTarget
    } as ViewPortPlan;

    if (prevViewModelTarget !== nextViewModelTarget) {
      viewPortPlan.strategy = activationStrategy.replace;
    } else if ('determineActivationStrategy' in prevViewPortInstruction.component.viewModel) {
      // export class Home {
      //   determineActivationStrategy() {
      //     return 'no-change';
      //   }
      // }
      viewPortPlan.strategy = prevViewPortInstruction.component.viewModel
        .determineActivationStrategy(...instruction.lifecycleArgs);
    } else if (config.activationStrategy) {
      // route config: { moduleId: ..., activationStrategy: someStrategy }
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
          childNavInstruction.plan = childPlanOrRedirect;
          // for bluebird ?
          return null;
        });

      pending.push(task);
    }
  }

  await Promise.all(pending);
  return viewPortPlans;
}

/**@internal exported for unit testing */
export function hasDifferentParameterValues(prev: NavigationInstruction, next: NavigationInstruction): boolean {
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
