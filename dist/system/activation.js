System.register(['./navigation-plan', './navigation-commands', './util'], function (_export) {
  var INVOKE_LIFECYCLE, REPLACE, isNavigationCommand, processPotential, _toConsumableArray, _classCallCheck, _createClass, affirmations, CanDeactivatePreviousStep, CanActivateNextStep, DeactivatePreviousStep, ActivateNextStep;

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
          var result = (_current$controller = current.controller)[callbackName].apply(_current$controller, _toConsumableArray(current.lifecycleArgs));
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
      INVOKE_LIFECYCLE = _navigationPlan.INVOKE_LIFECYCLE;
      REPLACE = _navigationPlan.REPLACE;
    }, function (_navigationCommands) {
      isNavigationCommand = _navigationCommands.isNavigationCommand;
    }, function (_util) {
      processPotential = _util.processPotential;
    }],
    execute: function () {
      'use strict';

      _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      affirmations = ['yes', 'ok', 'true'];

      _export('affirmations', affirmations);

      CanDeactivatePreviousStep = (function () {
        function CanDeactivatePreviousStep() {
          _classCallCheck(this, CanDeactivatePreviousStep);
        }

        _createClass(CanDeactivatePreviousStep, [{
          key: 'run',
          value: function run(navigationContext, next) {
            return processDeactivatable(navigationContext.plan, 'canDeactivate', next);
          }
        }]);

        return CanDeactivatePreviousStep;
      })();

      _export('CanDeactivatePreviousStep', CanDeactivatePreviousStep);

      CanActivateNextStep = (function () {
        function CanActivateNextStep() {
          _classCallCheck(this, CanActivateNextStep);
        }

        _createClass(CanActivateNextStep, [{
          key: 'run',
          value: function run(navigationContext, next) {
            return processActivatable(navigationContext, 'canActivate', next);
          }
        }]);

        return CanActivateNextStep;
      })();

      _export('CanActivateNextStep', CanActivateNextStep);

      DeactivatePreviousStep = (function () {
        function DeactivatePreviousStep() {
          _classCallCheck(this, DeactivatePreviousStep);
        }

        _createClass(DeactivatePreviousStep, [{
          key: 'run',
          value: function run(navigationContext, next) {
            return processDeactivatable(navigationContext.plan, 'deactivate', next, true);
          }
        }]);

        return DeactivatePreviousStep;
      })();

      _export('DeactivatePreviousStep', DeactivatePreviousStep);

      ActivateNextStep = (function () {
        function ActivateNextStep() {
          _classCallCheck(this, ActivateNextStep);
        }

        _createClass(ActivateNextStep, [{
          key: 'run',
          value: function run(navigationContext, next) {
            return processActivatable(navigationContext, 'activate', next, true);
          }
        }]);

        return ActivateNextStep;
      })();

      _export('ActivateNextStep', ActivateNextStep);
    }
  };
});