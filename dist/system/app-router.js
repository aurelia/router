System.register(["aurelia-dependency-injection", "aurelia-history", "./router", "./pipeline-provider", "./navigation-commands"], function (_export) {
  "use strict";

  var Container, History, Router, PipelineProvider, isNavigationCommand, _prototypeProperties, _get, _inherits, AppRouter;


  function handleLinkClick(evt) {
    if (!this.isActive) {
      return;
    }

    var target = evt.target;
    if (target.tagName != "A") {
      return;
    }

    if (this.history._hasPushState) {
      if (!evt.altKey && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey && targetIsThisWindow(target)) {
        var href = target.getAttribute("href");

        if (href !== null && !(href.charAt(0) === "#" || /^[a-z]+:/i.test(href))) {
          evt.preventDefault();
          this.history.navigate(href);
        }
      }
    }
  }

  function targetIsThisWindow(target) {
    var targetWindow = target.getAttribute("target");

    return !targetWindow || targetWindow === window.name || targetWindow === "_self" || targetWindow === "top" && window === window.top;
  }
  return {
    setters: [function (_aureliaDependencyInjection) {
      Container = _aureliaDependencyInjection.Container;
    }, function (_aureliaHistory) {
      History = _aureliaHistory.History;
    }, function (_router) {
      Router = _router.Router;
    }, function (_pipelineProvider) {
      PipelineProvider = _pipelineProvider.PipelineProvider;
    }, function (_navigationCommands) {
      isNavigationCommand = _navigationCommands.isNavigationCommand;
    }],
    execute: function () {
      _prototypeProperties = function (child, staticProps, instanceProps) {
        if (staticProps) Object.defineProperties(child, staticProps);
        if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
      };

      _get = function get(object, property, receiver) {
        var desc = Object.getOwnPropertyDescriptor(object, property);

        if (desc === undefined) {
          var parent = Object.getPrototypeOf(object);

          if (parent === null) {
            return undefined;
          } else {
            return get(parent, property, receiver);
          }
        } else if ("value" in desc && desc.writable) {
          return desc.value;
        } else {
          var getter = desc.get;
          if (getter === undefined) {
            return undefined;
          }
          return getter.call(receiver);
        }
      };

      _inherits = function (child, parent) {
        if (typeof parent !== "function" && parent !== null) {
          throw new TypeError("Super expression must either be null or a function, not " + typeof parent);
        }
        child.prototype = Object.create(parent && parent.prototype, {
          constructor: {
            value: child,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
        if (parent) child.__proto__ = parent;
      };

      AppRouter = (function (Router) {
        var AppRouter = function AppRouter(container, history, pipelineProvider) {
          _get(Object.getPrototypeOf(AppRouter.prototype), "constructor", this).call(this, container, history);
          this.pipelineProvider = pipelineProvider;
          document.addEventListener("click", handleLinkClick.bind(this), true);
        };

        _inherits(AppRouter, Router);

        _prototypeProperties(AppRouter, {
          inject: {
            value: function () {
              return [Container, History, PipelineProvider];
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        }, {
          loadUrl: {
            value: function (url) {
              var _this = this;
              return this.createNavigationInstruction(url).then(function (instruction) {
                return _this.queueInstruction(instruction);
              })["catch"](function (error) {
                console.error(error);

                if (_this.history.previousFragment) {
                  _this.navigate(_this.history.previousFragment, false);
                }
              });
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          queueInstruction: {
            value: function (instruction) {
              var _this2 = this;
              return new Promise(function (resolve) {
                instruction.resolve = resolve;
                _this2.queue.unshift(instruction);
                _this2.dequeueInstruction();
              });
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          dequeueInstruction: {
            value: function () {
              var _this3 = this;
              if (this.isNavigating) {
                return;
              }

              var instruction = this.queue.shift();
              this.queue = [];

              if (!instruction) {
                return;
              }

              this.isNavigating = true;

              var context = this.createNavigationContext(instruction);
              var pipeline = this.pipelineProvider.createPipeline(context);

              pipeline.run(context).then(function (result) {
                _this3.isNavigating = false;

                if (result.completed) {
                  _this3.history.previousFragment = instruction.fragment;
                }

                if (result.output instanceof Error) {
                  console.error(result.output);
                }

                if (isNavigationCommand(result.output)) {
                  result.output.navigate(_this3);
                } else if (!result.completed && _this3.history.previousFragment) {
                  _this3.navigate(_this3.history.previousFragment, false);
                }

                instruction.resolve(result);
                _this3.dequeueInstruction();
              })["catch"](function (error) {
                console.error(error);
              });
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          registerViewPort: {
            value: function (viewPort, name) {
              var _this4 = this;
              _get(Object.getPrototypeOf(AppRouter.prototype), "registerViewPort", this).call(this, viewPort, name);

              if (!this.isActive) {
                if ("configureRouter" in this.container.viewModel) {
                  var result = this.container.viewModel.configureRouter() || Promise.resolve();
                  return result.then(function () {
                    return _this4.activate();
                  });
                } else {
                  this.activate();
                }
              } else {
                this.dequeueInstruction();
              }
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          activate: {
            value: function (options) {
              if (this.isActive) {
                return;
              }

              this.isActive = true;
              this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
              this.history.activate(this.options);
              this.dequeueInstruction();
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          deactivate: {
            value: function () {
              this.isActive = false;
              this.history.deactivate();
            },
            writable: true,
            enumerable: true,
            configurable: true
          },
          reset: {
            value: function () {
              _get(Object.getPrototypeOf(AppRouter.prototype), "reset", this).call(this);
              this.queue = [];
              delete this.options;
            },
            writable: true,
            enumerable: true,
            configurable: true
          }
        });

        return AppRouter;
      })(Router);
      _export("AppRouter", AppRouter);
    }
  };
});