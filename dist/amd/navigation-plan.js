define(["exports"], function (exports) {
  "use strict";

  var _toArray = function (arr) {
    return Array.isArray(arr) ? arr : Array.from(arr);
  };

  exports.buildNavigationPlan = buildNavigationPlan;
  var NO_CHANGE = exports.NO_CHANGE = "no-change";
  var INVOKE_LIFECYCLE = exports.INVOKE_LIFECYCLE = "invoke-lifecycle";
  var REPLACE = exports.REPLACE = "replace";

  function buildNavigationPlan(navigationContext, forceLifecycleMinimum) {
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
          viewPortPlan.strategy = REPLACE;
        } else if ("determineActivationStrategy" in prevViewPortInstruction.component.executionContext) {
          viewPortPlan.strategy = prevViewPortInstruction.component.executionContext.determineActivationStrategy.apply(prevViewPortInstruction.component.executionContext, _toArray(next.lifecycleArgs));
        } else if (newParams || forceLifecycleMinimum) {
          viewPortPlan.strategy = INVOKE_LIFECYCLE;
        } else {
          viewPortPlan.strategy = NO_CHANGE;
        }

        if (viewPortPlan.strategy !== REPLACE && prevViewPortInstruction.childRouter) {
          var path = next.getWildcardPath();
          var task = prevViewPortInstruction.childRouter.createNavigationInstruction(path, next).then(function (childInstruction) {
            viewPortPlan.childNavigationContext = prevViewPortInstruction.childRouter.createNavigationContext(childInstruction);

            return buildNavigationPlan(viewPortPlan.childNavigationContext, viewPortPlan.strategy == INVOKE_LIFECYCLE).then(function (childPlan) {
              viewPortPlan.childNavigationContext.plan = childPlan;
            });
          });

          pending.push(task);
        }
      }

      return Promise.all(pending).then(function () {
        return plan;
      });
    } else {
      for (viewPortName in next.config.viewPorts) {
        plan[viewPortName] = {
          name: viewPortName,
          strategy: REPLACE,
          config: next.config.viewPorts[viewPortName]
        };
      }

      return Promise.resolve(plan);
    }
  }

  var BuildNavigationPlanStep = (function () {
    var BuildNavigationPlanStep = function BuildNavigationPlanStep() {};

    BuildNavigationPlanStep.prototype.run = function (navigationContext, next) {
      return buildNavigationPlan(navigationContext).then(function (plan) {
        navigationContext.plan = plan;
        return next();
      })["catch"](next.cancel);
    };

    return BuildNavigationPlanStep;
  })();

  exports.BuildNavigationPlanStep = BuildNavigationPlanStep;


  function hasDifferentParameterValues(prev, next) {
    var prevParams = prev.params, nextParams = next.params, nextWildCardName = next.config.hasChildRouter ? next.getWildCardName() : null;

    for (var key in nextParams) {
      if (key == nextWildCardName) {
        continue;
      }

      if (prevParams[key] != nextParams[key]) {
        return true;
      }
    }

    return false;
  }
});