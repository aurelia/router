System.register(['./navigation-commands'], function (_export) {
  var Redirect, _toConsumableArray, _classCallCheck, _createClass, NO_CHANGE, INVOKE_LIFECYCLE, REPLACE, BuildNavigationPlanStep;

  _export('buildNavigationPlan', buildNavigationPlan);

  function buildNavigationPlan(navigationContext, forceLifecycleMinimum) {
    var prev = navigationContext.prevInstruction;
    var next = navigationContext.nextInstruction;
    var plan = {},
        viewPortName;

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
        } else if ('determineActivationStrategy' in prevViewPortInstruction.component.executionContext) {
          var _prevViewPortInstruction$component$executionContext;

          viewPortPlan.strategy = (_prevViewPortInstruction$component$executionContext = prevViewPortInstruction.component.executionContext).determineActivationStrategy.apply(_prevViewPortInstruction$component$executionContext, _toConsumableArray(next.lifecycleArgs));
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

    return false;
  }
  return {
    setters: [function (_navigationCommands) {
      Redirect = _navigationCommands.Redirect;
    }],
    execute: function () {
      'use strict';

      _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      NO_CHANGE = 'no-change';

      _export('NO_CHANGE', NO_CHANGE);

      INVOKE_LIFECYCLE = 'invoke-lifecycle';

      _export('INVOKE_LIFECYCLE', INVOKE_LIFECYCLE);

      REPLACE = 'replace';

      _export('REPLACE', REPLACE);

      BuildNavigationPlanStep = (function () {
        function BuildNavigationPlanStep() {
          _classCallCheck(this, BuildNavigationPlanStep);
        }

        _createClass(BuildNavigationPlanStep, [{
          key: 'run',
          value: function run(navigationContext, next) {
            if (navigationContext.nextInstruction.config.redirect) {
              return next.cancel(new Redirect(navigationContext.nextInstruction.config.redirect));
            }

            return buildNavigationPlan(navigationContext).then(function (plan) {
              navigationContext.plan = plan;
              return next();
            })['catch'](next.cancel);
          }
        }]);

        return BuildNavigationPlanStep;
      })();

      _export('BuildNavigationPlanStep', BuildNavigationPlanStep);
    }
  };
});