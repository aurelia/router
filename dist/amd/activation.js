define(["exports", "./navigation-plan", "./navigation-commands", "./util"], function (exports, _navigationPlan, _navigationCommands, _util) {
  "use strict";

  var _toArray = function (arr) {
    return Array.isArray(arr) ? arr : Array.from(arr);
  };

  var INVOKE_LIFECYCLE = _navigationPlan.INVOKE_LIFECYCLE;
  var REPLACE = _navigationPlan.REPLACE;
  var isNavigationCommand = _navigationCommands.isNavigationCommand;
  var processPotential = _util.processPotential;
  var affirmations = exports.affirmations = ["yes", "ok", "true"];

  var CanDeactivatePreviousStep = (function () {
    var CanDeactivatePreviousStep = function CanDeactivatePreviousStep() {};

    CanDeactivatePreviousStep.prototype.run = function (navigationContext, next) {
      return processDeactivatable(navigationContext.plan, "canDeactivate", next);
    };

    return CanDeactivatePreviousStep;
  })();

  exports.CanDeactivatePreviousStep = CanDeactivatePreviousStep;
  var CanActivateNextStep = (function () {
    var CanActivateNextStep = function CanActivateNextStep() {};

    CanActivateNextStep.prototype.run = function (navigationContext, next) {
      return processActivatable(navigationContext, "canActivate", next);
    };

    return CanActivateNextStep;
  })();

  exports.CanActivateNextStep = CanActivateNextStep;
  var DeactivatePreviousStep = (function () {
    var DeactivatePreviousStep = function DeactivatePreviousStep() {};

    DeactivatePreviousStep.prototype.run = function (navigationContext, next) {
      return processDeactivatable(navigationContext.plan, "deactivate", next, true);
    };

    return DeactivatePreviousStep;
  })();

  exports.DeactivatePreviousStep = DeactivatePreviousStep;
  var ActivateNextStep = (function () {
    var ActivateNextStep = function ActivateNextStep() {};

    ActivateNextStep.prototype.run = function (navigationContext, next) {
      return processActivatable(navigationContext, "activate", next, true);
    };

    return ActivateNextStep;
  })();

  exports.ActivateNextStep = ActivateNextStep;


  function processDeactivatable(plan, callbackName, next, ignoreResult) {
    var infos = findDeactivatable(plan, callbackName), i = infos.length;

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
          var controller = infos[i];
          var result = controller[callbackName]();
          return processPotential(result, inspect, next.cancel);
        } catch (error) {
          return next.cancel(error);
        }
      } else {
        return next();
      }
    }

    return iterate();
  }

  function findDeactivatable(plan, callbackName, list) {
    list = list || [];

    for (var viewPortName in plan) {
      var viewPortPlan = plan[viewPortName];
      var prevComponent = viewPortPlan.prevComponent;

      if ((viewPortPlan.strategy == INVOKE_LIFECYCLE || viewPortPlan.strategy == REPLACE) && prevComponent) {
        var controller = prevComponent.executionContext;

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

  function addPreviousDeactivatable(component, callbackName, list) {
    var controller = component.executionContext;

    if (controller.router && controller.router.currentInstruction) {
      var viewPortInstructions = controller.router.currentInstruction.viewPortInstructions;

      for (var viewPortName in viewPortInstructions) {
        var viewPortInstruction = viewPortInstructions[viewPortName];
        var prevComponent = viewPortInstruction.component;
        var prevController = prevComponent.executionContext;

        if (callbackName in prevController) {
          list.push(prevController);
        }

        addPreviousDeactivatable(prevComponent, callbackName, list);
      }
    }
  }

  function processActivatable(navigationContext, callbackName, next, ignoreResult) {
    var infos = findActivatable(navigationContext, callbackName), length = infos.length, i = -1;

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
          var current = infos[i];
          var result = current.controller[callbackName].apply(current.controller, _toArray(current.lifecycleArgs));
          return processPotential(result, function (val) {
            return inspect(val, current.router);
          }, next.cancel);
        } catch (error) {
          return next.cancel(error);
        }
      } else {
        return next();
      }
    }

    return iterate();
  }

  function findActivatable(navigationContext, callbackName, list, router) {
    var plan = navigationContext.plan;
    var next = navigationContext.nextInstruction;

    list = list || [];

    Object.keys(plan).filter(function (viewPortName) {
      var viewPortPlan = plan[viewPortName];
      var viewPortInstruction = next.viewPortInstructions[viewPortName];
      var controller = viewPortInstruction.component.executionContext;

      if ((viewPortPlan.strategy === INVOKE_LIFECYCLE || viewPortPlan.strategy === REPLACE) && callbackName in controller) {
        list.push({
          controller: controller,
          lifecycleArgs: viewPortInstruction.lifecycleArgs,
          router: router
        });
      }

      if (viewPortPlan.childNavigationContext) {
        findActivatable(viewPortPlan.childNavigationContext, callbackName, list, controller.router || router);
      }
    });

    return list;
  }

  function shouldContinue(output, router) {
    if (output instanceof Error) {
      return false;
    }

    if (isNavigationCommand(output)) {
      output.router = router;
      return !!output.shouldContinueProcessing;
    }

    if (typeof output == "string") {
      return affirmations.indexOf(value.toLowerCase()) !== -1;
    }

    if (typeof output == "undefined") {
      return true;
    }

    return output;
  }
});