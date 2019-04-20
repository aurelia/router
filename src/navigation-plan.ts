import { ViewPortPlan, ViewPortInstruction, RouteConfig, ViewPort } from './interfaces';
import { Redirect } from './redirect';
import { NavigationInstruction } from './navigation-instruction';
import { InternalActivationStrategy, ActivationStrategyType } from './activation-strategy';

type ViewPortPlansRecord = Record<string, ViewPortPlan>;

/**
 * @internal exported for unit testing
 */
export function _buildNavigationPlan(
  instruction: NavigationInstruction,
  forceLifecycleMinimum?: boolean
): Promise<ViewPortPlansRecord | Redirect> {
  let config = instruction.config;

  if ('redirect' in config) {
    return buildRedirectPlan(instruction);
  }

  const prevInstruction = instruction.previousInstruction;
  const defaultViewPortConfigs = instruction.router.viewPortDefaults;

  if (prevInstruction) {
    return buildTransitionPlans(instruction, prevInstruction, defaultViewPortConfigs, forceLifecycleMinimum);
  }

  // first navigation, only need to prepare a few information for each viewport plan
  const viewPortPlans: ViewPortPlansRecord = {};
  let viewPortConfigs = config.viewPorts;
  for (let viewPortName in viewPortConfigs) {
    let viewPortConfig = viewPortConfigs[viewPortName];
    if (viewPortConfig.moduleId === null && viewPortName in defaultViewPortConfigs) {
      viewPortConfig = defaultViewPortConfigs[viewPortName];
    }
    viewPortPlans[viewPortName] = {
      name: viewPortName,
      strategy: InternalActivationStrategy.Replace,
      config: viewPortConfig
    };
  }

  return Promise.resolve(viewPortPlans);
}

/**
 * Build redirect plan based on config of a navigation instruction
 * @internal exported for unit testing
 */
export const buildRedirectPlan = (instruction: NavigationInstruction) => {
  const config = instruction.config;
  const router = instruction.router;
  return router
    ._createNavigationInstruction(config.redirect)
    .then(redirectInstruction => {

      const params: Record<string, any> = {};
      const originalInstructionParams = instruction.params;
      const redirectInstructionParams = redirectInstruction.params;

      for (let key in redirectInstructionParams) {
        // If the param on the redirect points to another param, e.g. { route: first/:this, redirect: second/:this }
        let val = redirectInstructionParams[key];
        if (typeof val === 'string' && val[0] === ':') {
          val = val.slice(1);
          // And if that param is found on the original instruction then use it
          if (val in originalInstructionParams) {
            params[key] = originalInstructionParams[val];
          }
        } else {
          params[key] = redirectInstructionParams[key];
        }
      }
      let redirectLocation = router.generate(redirectInstruction.config, params, instruction.options);

      // Special handling for child routes
      for (let key in originalInstructionParams) {
        redirectLocation = redirectLocation.replace(`:${key}`, originalInstructionParams[key]);
      }

      let queryString = instruction.queryString;
      if (queryString) {
        redirectLocation += '?' + queryString;
      }

      return Promise.resolve(new Redirect(redirectLocation));
    });
};

/**
 * @param viewPortPlans the Plan record that holds information about built plans
 * @internal exported for unit testing
 */
export const buildTransitionPlans = (
  currentInstruction: NavigationInstruction,
  previousInstruction: NavigationInstruction,
  defaultViewPortConfigs: Record<string, ViewPortInstruction>,
  forceLifecycleMinimum?: boolean
): Promise<ViewPortPlansRecord> => {

  let viewPortPlans: ViewPortPlansRecord = {};
  let newInstructionConfig = currentInstruction.config;
  let hasNewParams = hasDifferentParameterValues(previousInstruction, currentInstruction);
  let pending: Promise<void>[] = [];
  let previousViewPortInstructions = previousInstruction.viewPortInstructions as Record<string, ViewPortInstruction>;

  for (let viewPortName in previousViewPortInstructions) {

    const prevViewPortInstruction = previousViewPortInstructions[viewPortName];
    const prevViewPortComponent = prevViewPortInstruction.component;
    const newInstructionViewPortConfigs = newInstructionConfig.viewPorts as Record<string, RouteConfig>;

    // if this is invoked on a viewport without any changes, based on new url,
    // newViewPortConfig will be the existing viewport instruction
    let nextViewPortConfig = viewPortName in newInstructionViewPortConfigs
      ? newInstructionViewPortConfigs[viewPortName]
      : prevViewPortInstruction;

    if (nextViewPortConfig.moduleId === null && viewPortName in defaultViewPortConfigs) {
      nextViewPortConfig = defaultViewPortConfigs[viewPortName];
    }

    const viewPortActivationStrategy = determineActivationStrategy(
      currentInstruction,
      prevViewPortInstruction,
      nextViewPortConfig,
      hasNewParams,
      forceLifecycleMinimum
    );
    const viewPortPlan = viewPortPlans[viewPortName] = {
      name: viewPortName,
      // ViewPortInstruction can quack like a RouteConfig
      config: nextViewPortConfig as RouteConfig,
      prevComponent: prevViewPortComponent,
      prevModuleId: prevViewPortInstruction.moduleId,
      strategy: viewPortActivationStrategy
    } as ViewPortPlan;

    // recursively build nav plans for all existing child routers/viewports of this viewport
    // this is possible because existing child viewports and routers already have necessary information
    // to process the wildcard path from parent instruction
    if (viewPortActivationStrategy !== InternalActivationStrategy.Replace && prevViewPortInstruction.childRouter) {
      const path = currentInstruction.getWildcardPath();
      const task: Promise<void> = prevViewPortInstruction
        .childRouter
        ._createNavigationInstruction(path, currentInstruction)
        .then((childInstruction: NavigationInstruction) => {
          viewPortPlan.childNavigationInstruction = childInstruction;

          return _buildNavigationPlan(
            childInstruction,
            // is it safe to assume viewPortPlan has not been changed from previous assignment?
            // if so, can just use local variable viewPortPlanStrategy
            // there could be user code modifying viewport plan during _createNavigationInstruction?
            viewPortPlan.strategy === InternalActivationStrategy.InvokeLifecycle
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

  return Promise.all(pending).then(() => viewPortPlans);
};

/**
 * @param newViewPortConfig if this is invoked on a viewport without any changes, based on new url, newViewPortConfig will be the existing viewport instruction
 * @internal exported for unit testing
 */
export const determineActivationStrategy = (
  currentNavInstruction: NavigationInstruction,
  prevViewPortInstruction: ViewPortInstruction,
  newViewPortConfig: RouteConfig | ViewPortInstruction,
  // indicates whether there is difference between old and new url params
  hasNewParams: boolean,
  forceLifecycleMinimum?: boolean
): ActivationStrategyType => {

  let newInstructionConfig = currentNavInstruction.config;
  let prevViewPortViewModel = prevViewPortInstruction.component.viewModel;
  let viewPortPlanStrategy: ActivationStrategyType;

  if (prevViewPortInstruction.moduleId !== newViewPortConfig.moduleId) {
    viewPortPlanStrategy = InternalActivationStrategy.Replace;
  }
  else if ('determineActivationStrategy' in prevViewPortViewModel) {
    viewPortPlanStrategy = prevViewPortViewModel.determineActivationStrategy(...currentNavInstruction.lifecycleArgs);
  }
  else if (newInstructionConfig.activationStrategy) {
    viewPortPlanStrategy = newInstructionConfig.activationStrategy;
  }
  else if (hasNewParams || forceLifecycleMinimum) {
    viewPortPlanStrategy = InternalActivationStrategy.InvokeLifecycle;
  }
  else {
    viewPortPlanStrategy = InternalActivationStrategy.NoChange;
  }
  return viewPortPlanStrategy;
};

/**@internal exported for unit testing */
export const hasDifferentParameterValues = (prev: NavigationInstruction, next: NavigationInstruction): boolean => {
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
};
