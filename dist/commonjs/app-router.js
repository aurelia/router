"use strict";

var _extends = function (child, parent) {
  child.prototype = Object.create(parent.prototype, {
    constructor: {
      value: child,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  child.__proto__ = parent;
};

var History = require('aurelia-history').History;
var extend = require('./util').extend;
var Router = require('./router').Router;
var PipelineProvider = require('./pipeline-provider').PipelineProvider;
var isNavigationCommand = require('./navigation-commands').isNavigationCommand;
var AppRouter = (function (Router) {
  var AppRouter = function AppRouter(history, pipelineProvider) {
    Router.call(this, history);
    this.pipelineProvider = pipelineProvider;
    document.addEventListener("click", handleLinkClick.bind(this), true);
  };

  _extends(AppRouter, Router);

  AppRouter.inject = function () {
    return [History, PipelineProvider];
  };

  AppRouter.prototype.loadUrl = function (url) {
    var _this = this;
    return this.createNavigationInstruction(url).then(function (instruction) {
      return _this.queueInstruction(instruction);
    })["catch"](function (error) {
      console.error(error);

      if (_this.history.previousFragment) {
        _this.navigate(_this.history.previousFragment, false);
      }
    });
  };

  AppRouter.prototype.queueInstruction = function (instruction) {
    var _this2 = this;
    return new Promise(function (resolve) {
      instruction.resolve = resolve;
      _this2.queue.unshift(instruction);
      _this2.dequeueInstruction();
    });
  };

  AppRouter.prototype.dequeueInstruction = function () {
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
    });
  };

  AppRouter.prototype.registerViewPort = function (viewPort, name) {
    Router.prototype.registerViewPort.call(this, viewPort, name);

    if (!this.isActive) {
      this.activate();
    } else {
      this.dequeueInstruction();
    }
  };

  AppRouter.prototype.activate = function (options) {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.options = extend({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
    this.history.activate(this.options);
    this.dequeueInstruction();
  };

  AppRouter.prototype.deactivate = function () {
    this.isActive = false;
    this.history.deactivate();
  };

  AppRouter.prototype.reset = function () {
    Router.prototype.reset.call(this);
    this.queue = [];
    delete this.options;
  };

  return AppRouter;
})(Router);

exports.AppRouter = AppRouter;


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

      if (href !== null && !(href.charAt(0) === "#" || (/^[a-z]+:/i).test(href))) {
        evt.preventDefault();
        this.history.navigate(href);
      }
    }
  }
}

function targetIsThisWindow(target) {
  var targetWindow = target.getAttribute("target");

  return !targetWindow || targetWindow === window.name || targetWindow === "_self" || (targetWindow === "top" && window === window.top);
}