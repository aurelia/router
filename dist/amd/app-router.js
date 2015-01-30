define(["exports", "aurelia-dependency-injection", "aurelia-history", "./router", "./pipeline-provider", "./navigation-commands"], function (exports, _aureliaDependencyInjection, _aureliaHistory, _router, _pipelineProvider, _navigationCommands) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

  var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

  var Container = _aureliaDependencyInjection.Container;
  var History = _aureliaHistory.History;
  var Router = _router.Router;
  var PipelineProvider = _pipelineProvider.PipelineProvider;
  var isNavigationCommand = _navigationCommands.isNavigationCommand;
  var AppRouter = exports.AppRouter = (function (Router) {
    function AppRouter(container, history, pipelineProvider) {
      _get(Object.getPrototypeOf(AppRouter.prototype), "constructor", this).call(this, container, history);
      this.pipelineProvider = pipelineProvider;
      document.addEventListener("click", handleLinkClick.bind(this), true);
    }

    _inherits(AppRouter, Router);

    _prototypeProperties(AppRouter, {
      inject: {
        value: function inject() {
          return [Container, History, PipelineProvider];
        },
        writable: true,
        configurable: true
      }
    }, {
      loadUrl: {
        value: function loadUrl(url) {
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
        configurable: true
      },
      queueInstruction: {
        value: function queueInstruction(instruction) {
          var _this = this;
          return new Promise(function (resolve) {
            instruction.resolve = resolve;
            _this.queue.unshift(instruction);
            _this.dequeueInstruction();
          });
        },
        writable: true,
        configurable: true
      },
      dequeueInstruction: {
        value: function dequeueInstruction() {
          var _this = this;
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
            _this.isNavigating = false;

            if (result.completed) {
              _this.history.previousFragment = instruction.fragment;
            }

            if (result.output instanceof Error) {
              console.error(result.output);
            }

            if (isNavigationCommand(result.output)) {
              result.output.navigate(_this);
            } else if (!result.completed && _this.history.previousFragment) {
              _this.navigate(_this.history.previousFragment, false);
            }

            instruction.resolve(result);
            _this.dequeueInstruction();
          })["catch"](function (error) {
            console.error(error);
          });
        },
        writable: true,
        configurable: true
      },
      registerViewPort: {
        value: function registerViewPort(viewPort, name) {
          var _this = this;
          _get(Object.getPrototypeOf(AppRouter.prototype), "registerViewPort", this).call(this, viewPort, name);

          if (!this.isActive) {
            if ("configureRouter" in this.container.viewModel) {
              var result = this.container.viewModel.configureRouter() || Promise.resolve();
              return result.then(function () {
                return _this.activate();
              });
            } else {
              this.activate();
            }
          } else {
            this.dequeueInstruction();
          }
        },
        writable: true,
        configurable: true
      },
      activate: {
        value: function activate(options) {
          if (this.isActive) {
            return;
          }

          this.isActive = true;
          this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
          this.history.activate(this.options);
          this.dequeueInstruction();
        },
        writable: true,
        configurable: true
      },
      deactivate: {
        value: function deactivate() {
          this.isActive = false;
          this.history.deactivate();
        },
        writable: true,
        configurable: true
      },
      reset: {
        value: function reset() {
          _get(Object.getPrototypeOf(AppRouter.prototype), "reset", this).call(this);
          this.queue = [];
          this.options = null;
        },
        writable: true,
        configurable: true
      }
    });

    return AppRouter;
  })(Router);


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
  exports.__esModule = true;
});