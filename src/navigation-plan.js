import {Redirect} from './navigation-commands';

export const activationStrategy = {
  noChange: 'no-change',
  invokeLifecycle: 'invoke-lifecycle',
  replace: 'replace'
};

export function buildNavigationPlan(navigationContext, forceLifecycleMinimum) {
  var prev = navigationContext.prevInstruction;
  var next = navigationContext.nextInstruction;
  var plan = {}, viewPortName;

  if (prev) {
    var newParams = hasDifferentParameterValues(prev, next);
    var pending = [];

    for (viewPortName in prev.viewPortInstructions) {
      var prevViewPortInstruction = prev.viewPortInstructions[viewPortName];
      var nextViewPortConfig = next.config.viewPorts[viewPortName];
      var viewPortPlan = plan[viewPortName] = {
        name: viewPortName,
        config: nextViewPortConfig,
        prevComponent: prevViewPortInstruction.component,
        prevModuleId: prevViewPortInstruction.moduleId
      };

      if (prevViewPortInstruction.moduleId != nextViewPortConfig.moduleId) {
        viewPortPlan.strategy = activationStrategy.replace;
      } else if ('determineActivationStrategy' in prevViewPortInstruction.component.executionContext) {
         //TODO: should we tell them if the parent had a lifecycle min change?
        viewPortPlan.strategy = prevViewPortInstruction.component.executionContext
          .determineActivationStrategy(...next.lifecycleArgs);
      } else if (newParams || forceLifecycleMinimum) {
        viewPortPlan.strategy = activationStrategy.invokeLifecycle;
      } else {
        viewPortPlan.strategy = activationStrategy.noChange;
      }

      if (viewPortPlan.strategy !== activationStrategy.replace && prevViewPortInstruction.childRouter) {
        var path = next.getWildcardPath();
        var task = prevViewPortInstruction.childRouter
          .createNavigationInstruction(path, next).then(childInstruction => {
            viewPortPlan.childNavigationContext = prevViewPortInstruction.childRouter
              .createNavigationContext(childInstruction);

            return buildNavigationPlan(
              viewPortPlan.childNavigationContext, 
              viewPortPlan.strategy == activationStrategy.invokeLifecycle)
              .then(childPlan => {
                viewPortPlan.childNavigationContext.plan = childPlan;
              });
          });

        pending.push(task);
      }
    }

    return Promise.all(pending).then(() => plan);
  }else{
    for (viewPortName in next.config.viewPorts) {
      plan[viewPortName] = {
        name: viewPortName,
        strategy: activationStrategy.replace,
        config: next.config.viewPorts[viewPortName]
      };
    }

    return Promise.resolve(plan);
  }
}

export class BuildNavigationPlanStep {
	run(navigationContext, next) {
    if (navigationContext.nextInstruction.config.redirect) {
      return next.cancel(new Redirect(navigationContext.nextInstruction.config.redirect));
    }

    return buildNavigationPlan(navigationContext)
      .then(plan => {
        navigationContext.plan = plan;
        return next();
      }).catch(next.cancel);
	}
}

function hasDifferentParameterValues(prev, next) {
  var prevParams = prev.params,
      nextParams = next.params,
      nextWildCardName = next.config.hasChildRouter ? next.getWildCardName() : null;

  for (var key in nextParams) {
    if (key == nextWildCardName) {
      continue;
    }

    if (prevParams[key] != nextParams[key]) {
      return true;
    }
  }

  for (var key in prevParams) {
    if (prevParams[key] !== nextParams[key]) {
      return true;
    }
  }

  return false;
}
