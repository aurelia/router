define(['exports', 'core-js', 'aurelia-dependency-injection', 'aurelia-history', './router', './pipeline-provider', './navigation-commands', 'aurelia-event-aggregator', './router-configuration'], function (exports, _coreJs, _aureliaDependencyInjection, _aureliaHistory, _router, _pipelineProvider, _navigationCommands, _aureliaEventAggregator, _routerConfiguration) {
  'use strict';

  var _interopRequire = function (obj) { return obj && obj.__esModule ? obj['default'] : obj; };

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _inherits = function (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

  exports.__esModule = true;

  var _core = _interopRequire(_coreJs);

  var AppRouter = (function (_Router) {
    function AppRouter(container, history, pipelineProvider, events) {
      _classCallCheck(this, AppRouter);

      _Router.call(this, container, history);
      this.pipelineProvider = pipelineProvider;
      document.addEventListener('click', handleLinkClick.bind(this), true);
      this.events = events;
    }

    _inherits(AppRouter, _Router);

    AppRouter.inject = function inject() {
      return [_aureliaDependencyInjection.Container, _aureliaHistory.History, _pipelineProvider.PipelineProvider, _aureliaEventAggregator.EventAggregator];
    };

    AppRouter.prototype.loadUrl = function loadUrl(url) {
      var _this = this;

      return this.createNavigationInstruction(url).then(function (instruction) {
        return _this.queueInstruction(instruction);
      })['catch'](function (error) {
        console.error(error);

        if (_this.history.previousFragment) {
          _this.navigate(_this.history.previousFragment, false);
        }
      });
    };

    AppRouter.prototype.queueInstruction = function queueInstruction(instruction) {
      var _this2 = this;

      return new Promise(function (resolve) {
        instruction.resolve = resolve;
        _this2.queue.unshift(instruction);
        _this2.dequeueInstruction();
      });
    };

    AppRouter.prototype.dequeueInstruction = function dequeueInstruction() {
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
      this.events.publish('router:navigation:processing', instruction);

      var context = this.createNavigationContext(instruction);
      var pipeline = this.pipelineProvider.createPipeline(context);

      pipeline.run(context).then(function (result) {
        _this3.isNavigating = false;

        if (!(result && 'completed' in result && 'output' in result)) {
          throw new Error('Expected router pipeline to return a navigation result, but got [' + JSON.stringify(result) + '] instead.');
        }

        if (result.completed) {
          _this3.history.previousFragment = instruction.fragment;
        }

        if (result.output instanceof Error) {
          console.error(result.output);
          _this3.events.publish('router:navigation:error', { instruction: instruction, result: result });
        }

        if (_navigationCommands.isNavigationCommand(result.output)) {
          result.output.navigate(_this3);
        } else if (!result.completed) {
          _this3.navigate(_this3.history.previousFragment || '', false);
          _this3.events.publish('router:navigation:cancelled', instruction);
        }

        instruction.resolve(result);
        _this3.dequeueInstruction();
      }).then(function (result) {
        return _this3.events.publish('router:navigation:complete', instruction);
      })['catch'](function (error) {
        console.error(error);
      });
    };

    AppRouter.prototype.registerViewPort = function registerViewPort(viewPort, name) {
      var _this4 = this;

      _Router.prototype.registerViewPort.call(this, viewPort, name);

      if (!this.isActive) {
        if ('configureRouter' in this.container.viewModel) {
          var config = new _routerConfiguration.RouterConfiguration();
          var result = Promise.resolve(this.container.viewModel.configureRouter(config, this));

          return result.then(function () {
            _this4.configure(config);
            _this4.activate();
          });
        } else {
          this.activate();
        }
      } else {
        this.dequeueInstruction();
      }
    };

    AppRouter.prototype.activate = function activate(options) {
      if (this.isActive) {
        return;
      }

      this.isActive = true;
      this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
      this.history.activate(this.options);
      this.dequeueInstruction();
    };

    AppRouter.prototype.deactivate = function deactivate() {
      this.isActive = false;
      this.history.deactivate();
    };

    AppRouter.prototype.reset = function reset() {
      _Router.prototype.reset.call(this);
      this.queue = [];
      this.options = null;
    };

    _createClass(AppRouter, [{
      key: 'isRoot',
      get: function () {
        return true;
      }
    }]);

    return AppRouter;
  })(_router.Router);

  exports.AppRouter = AppRouter;

  function findAnchor(el) {
    while (el) {
      if (el.tagName === 'A') {
        return el;
      }el = el.parentNode;
    }
  }

  function handleLinkClick(evt) {
    if (!this.isActive) {
      return;
    }

    var target = findAnchor(evt.target);
    if (!target) {
      return;
    }

    if (this.history._hasPushState) {
      if (!evt.altKey && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey && targetIsThisWindow(target)) {
        var href = target.getAttribute('href');

        if (href !== null && !(href.charAt(0) === '#' || /^[a-z]+:/i.test(href))) {
          evt.preventDefault();
          this.history.navigate(href);
        }
      }
    }
  }

  function targetIsThisWindow(target) {
    var targetWindow = target.getAttribute('target');

    return !targetWindow || targetWindow === window.name || targetWindow === '_self' || targetWindow === 'top' && window === window.top;
  }
});