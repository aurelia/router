"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _navigationPlan = require("./navigation-plan");

var INVOKE_LIFECYCLE = _navigationPlan.INVOKE_LIFECYCLE;
var REPLACE = _navigationPlan.REPLACE;

var isNavigationCommand = require("./navigation-commands").isNavigationCommand;

var processPotential = require("./util").processPotential;

var affirmations = exports.affirmations = ["yes", "ok", "true"];

var CanDeactivatePreviousStep = exports.CanDeactivatePreviousStep = (function () {
  function CanDeactivatePreviousStep() {
    _classCallCheck(this, CanDeactivatePreviousStep);
  }

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
})();

var CanActivateNextStep = exports.CanActivateNextStep = (function () {
  function CanActivateNextStep() {
    _classCallCheck(this, CanActivateNextStep);
  }

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
})();

var DeactivatePreviousStep = exports.DeactivatePreviousStep = (function () {
  function DeactivatePreviousStep() {
    _classCallCheck(this, DeactivatePreviousStep);
  }

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
})();

var ActivateNextStep = exports.ActivateNextStep = (function () {
  function ActivateNextStep() {
    _classCallCheck(this, ActivateNextStep);
  }

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
})();

function processDeactivatable(plan, callbackName, next, ignoreResult) {
  var infos = findDeactivatable(plan, callbackName),
      i = infos.length; //query from inside out

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
      i = -1; //query from top down

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
Object.defineProperty(exports, "__esModule", {
  value: true
});