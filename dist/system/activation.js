System.register(["./navigation-plan", "./navigation-commands", "./util"], function (_export) {
  "use strict";

  var INVOKE_LIFECYCLE, REPLACE, isNavigationCommand, processPotential, _toArray, _prototypeProperties, affirmations, CanDeactivatePreviousStep, CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep;


  function processDeactivatable(plan, callbackName, next, ignoreResult) {
    var infos = findDeactivatable(plan, callbackName),
        i = infos.length;

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
    var infos = findActivatable(navigationContext, callbackName),
        length = infos.length,
        i = -1;

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
          var _current$controller;
          var current = infos[i];
          var result = (_current$controller = current.controller)[callbackName].apply(_current$controller, _toArray(current.lifecycleArgs));
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
  return {
    setters: [function (_navigationPlan) {
      INVOKE_LIFECYCLE = _navigationPlan.INVOKE_LIFECYCLE;
      REPLACE = _navigationPlan.REPLACE;
    }, function (_navigationCommands) {
      isNavigationCommand = _navigationCommands.isNavigationCommand;
    }, function (_util) {
      processPotential = _util.processPotential;
    }],
    execute: function () {
      _toArray = function (arr) { return Array.isArray(arr) ? arr : Array.from(arr); };

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      affirmations = _export("affirmations", ["yes", "ok", "true"]);
      CanDeactivatePreviousStep = _export("CanDeactivatePreviousStep", (function () {
        function CanDeactivatePreviousStep() {}

        _prototypeProperties(CanDeactivatePreviousStep, null, {
          run: {
            value: function run(navigationContext, next) {
              return processDeactivatable(navigationContext.plan, "canDeactivate", next);
            },
            writable: true,
            configurable: true
          }
        });

        return CanDeactivatePreviousStep;
      })());
      CanActivateNextStep = _export("CanActivateNextStep", (function () {
        function CanActivateNextStep() {}

        _prototypeProperties(CanActivateNextStep, null, {
          run: {
            value: function run(navigationContext, next) {
              return processActivatable(navigationContext, "canActivate", next);
            },
            writable: true,
            configurable: true
          }
        });

        return CanActivateNextStep;
      })());
      DeactivatePreviousStep = _export("DeactivatePreviousStep", (function () {
        function DeactivatePreviousStep() {}

        _prototypeProperties(DeactivatePreviousStep, null, {
          run: {
            value: function run(navigationContext, next) {
              return processDeactivatable(navigationContext.plan, "deactivate", next, true);
            },
            writable: true,
            configurable: true
          }
        });

        return DeactivatePreviousStep;
      })());
      ActivateNextStep = _export("ActivateNextStep", (function () {
        function ActivateNextStep() {}

        _prototypeProperties(ActivateNextStep, null, {
          run: {
            value: function run(navigationContext, next) {
              return processActivatable(navigationContext, "activate", next, true);
            },
            writable: true,
            configurable: true
          }
        });

        return ActivateNextStep;
      })());
    }
  };
});