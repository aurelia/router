System.register(['./navigation-plan', './navigation-commands', './util'], function (_export) {
  'use strict';

  var activationStrategy, isNavigationCommand, processPotential, affirmations, CanDeactivatePreviousStep, CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

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

      if ((viewPortPlan.strategy == activationStrategy.invokeLifecycle || viewPortPlan.strategy == activationStrategy.replace) && prevComponent) {

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
    var controller = component.executionContext,
        childRouter = component.childRouter;

    if (childRouter && childRouter.currentInstruction) {
      var viewPortInstructions = childRouter.currentInstruction.viewPortInstructions;

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
          var result = (_current$controller = current.controller)[callbackName].apply(_current$controller, current.lifecycleArgs);
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

      if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle || viewPortPlan.strategy === activationStrategy.replace) && callbackName in controller) {
        list.push({
          controller: controller,
          lifecycleArgs: viewPortInstruction.lifecycleArgs,
          router: router
        });
      }

      if (viewPortPlan.childNavigationContext) {
        findActivatable(viewPortPlan.childNavigationContext, callbackName, list, viewPortInstruction.component.childRouter || router);
      }
    });

    return list;
  }

  function shouldContinue(output, router) {
    if (output instanceof Error) {
      return false;
    }

    if (isNavigationCommand(output)) {
      if (typeof output.setRouter === 'function') {
        output.setRouter(router);
      }

      return !!output.shouldContinueProcessing;
    }

    if (typeof output === 'string') {
      return affirmations.indexOf(output.toLowerCase()) !== -1;
    }

    if (typeof output === 'undefined') {
      return true;
    }

    return output;
  }
  return {
    setters: [function (_navigationPlan) {
      activationStrategy = _navigationPlan.activationStrategy;
    }, function (_navigationCommands) {
      isNavigationCommand = _navigationCommands.isNavigationCommand;
    }, function (_util) {
      processPotential = _util.processPotential;
    }],
    execute: function () {
      affirmations = ['yes', 'ok', 'true'];

      _export('affirmations', affirmations);

      CanDeactivatePreviousStep = (function () {
        function CanDeactivatePreviousStep() {
          _classCallCheck(this, CanDeactivatePreviousStep);
        }

        CanDeactivatePreviousStep.prototype.run = function run(navigationContext, next) {
          return processDeactivatable(navigationContext.plan, 'canDeactivate', next);
        };

        return CanDeactivatePreviousStep;
      })();

      _export('CanDeactivatePreviousStep', CanDeactivatePreviousStep);

      CanActivateNextStep = (function () {
        function CanActivateNextStep() {
          _classCallCheck(this, CanActivateNextStep);
        }

        CanActivateNextStep.prototype.run = function run(navigationContext, next) {
          return processActivatable(navigationContext, 'canActivate', next);
        };

        return CanActivateNextStep;
      })();

      _export('CanActivateNextStep', CanActivateNextStep);

      DeactivatePreviousStep = (function () {
        function DeactivatePreviousStep() {
          _classCallCheck(this, DeactivatePreviousStep);
        }

        DeactivatePreviousStep.prototype.run = function run(navigationContext, next) {
          return processDeactivatable(navigationContext.plan, 'deactivate', next, true);
        };

        return DeactivatePreviousStep;
      })();

      _export('DeactivatePreviousStep', DeactivatePreviousStep);

      ActivateNextStep = (function () {
        function ActivateNextStep() {
          _classCallCheck(this, ActivateNextStep);
        }

        ActivateNextStep.prototype.run = function run(navigationContext, next) {
          return processActivatable(navigationContext, 'activate', next, true);
        };

        return ActivateNextStep;
      })();

      _export('ActivateNextStep', ActivateNextStep);
    }
  };
});