define(['exports', './navigation-plan'], function (exports, _navigationPlan) {
  'use strict';

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  var NavigationContext = (function () {
    function NavigationContext(router, nextInstruction) {
      _classCallCheck(this, NavigationContext);

      this.router = router;
      this.nextInstruction = nextInstruction;
      this.currentInstruction = router.currentInstruction;
      this.prevInstruction = router.currentInstruction;
    }

    _createClass(NavigationContext, [{
      key: 'getAllContexts',
      value: function getAllContexts() {
        var acc = arguments[0] === undefined ? [] : arguments[0];

        acc.push(this);
        if (this.plan) {
          for (var key in this.plan) {
            this.plan[key].childNavigationContext && this.plan[key].childNavigationContext.getAllContexts(acc);
          }
        }
        return acc;
      }
    }, {
      key: 'nextInstructions',
      get: function () {
        return this.getAllContexts().map(function (c) {
          return c.nextInstruction;
        }).filter(function (c) {
          return c;
        });
      }
    }, {
      key: 'currentInstructions',
      get: function () {
        return this.getAllContexts().map(function (c) {
          return c.currentInstruction;
        }).filter(function (c) {
          return c;
        });
      }
    }, {
      key: 'prevInstructions',
      get: function () {
        return this.getAllContexts().map(function (c) {
          return c.prevInstruction;
        }).filter(function (c) {
          return c;
        });
      }
    }, {
      key: 'commitChanges',
      value: function commitChanges(waitToSwap) {
        var next = this.nextInstruction,
            prev = this.prevInstruction,
            viewPortInstructions = next.viewPortInstructions,
            router = this.router,
            loads = [],
            delaySwaps = [];

        router.currentInstruction = next;

        if (prev) {
          prev.config.navModel.isActive = false;
        }

        next.config.navModel.isActive = true;

        router.refreshBaseUrl();
        router.refreshNavigation();

        for (var viewPortName in viewPortInstructions) {
          var viewPortInstruction = viewPortInstructions[viewPortName];
          var viewPort = router.viewPorts[viewPortName];

          if (!viewPort) {
            throw new Error('There was no router-view found in the view for ' + viewPortInstruction.moduleId + '.');
          }

          if (viewPortInstruction.strategy === _navigationPlan.REPLACE) {
            if (waitToSwap) {
              delaySwaps.push({ viewPort: viewPort, viewPortInstruction: viewPortInstruction });
            }

            loads.push(viewPort.process(viewPortInstruction, waitToSwap).then(function (x) {
              if ('childNavigationContext' in viewPortInstruction) {
                return viewPortInstruction.childNavigationContext.commitChanges();
              }
            }));
          } else {
            if ('childNavigationContext' in viewPortInstruction) {
              loads.push(viewPortInstruction.childNavigationContext.commitChanges(waitToSwap));
            }
          }
        }

        return Promise.all(loads).then(function () {
          delaySwaps.forEach(function (x) {
            return x.viewPort.swap(x.viewPortInstruction);
          });
        });
      }
    }, {
      key: 'buildTitle',
      value: function buildTitle() {
        var separator = arguments[0] === undefined ? ' | ' : arguments[0];

        var next = this.nextInstruction,
            title = next.config.navModel.title || '',
            viewPortInstructions = next.viewPortInstructions,
            childTitles = [];

        for (var viewPortName in viewPortInstructions) {
          var viewPortInstruction = viewPortInstructions[viewPortName];

          if ('childNavigationContext' in viewPortInstruction) {
            var childTitle = viewPortInstruction.childNavigationContext.buildTitle(separator);
            if (childTitle) {
              childTitles.push(childTitle);
            }
          }
        }

        if (childTitles.length) {
          title = childTitles.join(separator) + (title ? separator : '') + title;
        }

        if (this.router.title) {
          title += (title ? separator : '') + this.router.title;
        }

        return title;
      }
    }]);

    return NavigationContext;
  })();

  exports.NavigationContext = NavigationContext;

  var CommitChangesStep = (function () {
    function CommitChangesStep() {
      _classCallCheck(this, CommitChangesStep);
    }

    _createClass(CommitChangesStep, [{
      key: 'run',
      value: function run(navigationContext, next) {
        return navigationContext.commitChanges(true).then(function () {
          var title = navigationContext.buildTitle();
          if (title) {
            document.title = title;
          }

          return next();
        });
      }
    }]);

    return CommitChangesStep;
  })();

  exports.CommitChangesStep = CommitChangesStep;
});