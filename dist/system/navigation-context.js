System.register(["./navigation-plan"], function (_export) {
  "use strict";

  var REPLACE, NavigationContext, CommitChangesStep;
  return {
    setters: [function (_navigationPlan) {
      REPLACE = _navigationPlan.REPLACE;
    }],
    execute: function () {
      NavigationContext = function NavigationContext(router, nextInstruction) {
        this.router = router;
        this.nextInstruction = nextInstruction;
        this.currentInstruction = router.currentInstruction;
        this.prevInstruction = router.currentInstruction;
      };

      NavigationContext.prototype.commitChanges = function (waitToSwap) {
        var next = this.nextInstruction, prev = this.prevInstruction, viewPortInstructions = next.viewPortInstructions, router = this.router, loads = [], delaySwaps = [];

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

          if (viewPortInstruction.strategy === REPLACE) {
            if (waitToSwap) {
              delaySwaps.push({ viewPort: viewPort, viewPortInstruction: viewPortInstruction });
            }

            loads.push(viewPort.process(viewPortInstruction, waitToSwap).then(function (x) {
              if ("childNavigationContext" in viewPortInstruction) {
                return viewPortInstruction.childNavigationContext.commitChanges();
              }
            }));
          } else {
            if ("childNavigationContext" in viewPortInstruction) {
              loads.push(viewPortInstruction.childNavigationContext.commitChanges(waitToSwap));
            }
          }
        }

        return Promise.all(loads).then(function () {
          delaySwaps.forEach(function (x) {
            return x.viewPort.swap(x.viewPortInstruction);
          });
        });
      };

      NavigationContext.prototype.buildTitle = function () {
        var separator = arguments[0] === undefined ? " | " : arguments[0];
        var next = this.nextInstruction, title = next.config.navModel.title || "", viewPortInstructions = next.viewPortInstructions, childTitles = [];

        for (var viewPortName in viewPortInstructions) {
          var viewPortInstruction = viewPortInstructions[viewPortName];

          if ("childNavigationContext" in viewPortInstruction) {
            var childTitle = viewPortInstruction.childNavigationContext.buildTitle(separator);
            if (childTitle) {
              childTitles.push(childTitle);
            }
          }
        }

        if (childTitles.length) {
          title = childTitles.join(separator) + (title ? separator : "") + title;
        }

        if (this.router.title) {
          title += (title ? separator : "") + this.router.title;
        }

        return title;
      };

      _export("NavigationContext", NavigationContext);

      CommitChangesStep = function CommitChangesStep() {};

      CommitChangesStep.prototype.run = function (navigationContext, next) {
        navigationContext.commitChanges(true);

        var title = navigationContext.buildTitle();
        if (title) {
          document.title = title;
        }

        return next();
      };

      _export("CommitChangesStep", CommitChangesStep);
    }
  };
});