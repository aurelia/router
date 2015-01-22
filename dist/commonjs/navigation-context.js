"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var REPLACE = require("./navigation-plan").REPLACE;
var NavigationContext = (function () {
  function NavigationContext(router, nextInstruction) {
    this.router = router;
    this.nextInstruction = nextInstruction;
    this.currentInstruction = router.currentInstruction;
    this.prevInstruction = router.currentInstruction;
  }

  _prototypeProperties(NavigationContext, null, {
    commitChanges: {
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
            throw new Error("There was no router-view found in the view for " + viewPortInstruction.moduleId + ".");
          }

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
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    buildTitle: {
      value: function buildTitle() {
        var separator = arguments[0] === undefined ? " | " : arguments[0];
        var next = this.nextInstruction,
            title = next.config.navModel.title || "",
            viewPortInstructions = next.viewPortInstructions,
            childTitles = [];

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
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return NavigationContext;
})();

exports.NavigationContext = NavigationContext;
var CommitChangesStep = (function () {
  function CommitChangesStep() {}

  _prototypeProperties(CommitChangesStep, null, {
    run: {
      value: function run(navigationContext, next) {
        navigationContext.commitChanges(true);

        var title = navigationContext.buildTitle();
        if (title) {
          document.title = title;
        }

        return next();
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return CommitChangesStep;
})();

exports.CommitChangesStep = CommitChangesStep;