import core from 'core-js';
import {Container} from 'aurelia-dependency-injection';
import {History} from 'aurelia-history';
import {Router} from './router';
import {PipelineProvider} from './pipeline-provider';
import {isNavigationCommand} from './navigation-commands';
import {EventAggregator} from 'aurelia-event-aggregator';
import {RouterConfiguration} from './router-configuration';

export class AppRouter extends Router {
  static inject(){ return [Container, History, PipelineProvider, EventAggregator]; }
  constructor(container, history, pipelineProvider, events) {
    super(container, history);
    this.pipelineProvider = pipelineProvider;
    document.addEventListener('click', handleLinkClick.bind(this), true);
    this.events = events;
    this.maxInstructionCount = 10;
  }

  get isRoot() {
    return true;
  }

  loadUrl(url) {
    return this.createNavigationInstruction(url)
      .then(instruction => this.queueInstruction(instruction))
      .catch(error => {
        console.error(error);
        restorePreviousLocation(this);
      });
  }

  queueInstruction(instruction) {
    return new Promise(resolve => {
      instruction.resolve = resolve;
      this.queue.unshift(instruction);
      this.dequeueInstruction();
    });
  }

  dequeueInstruction(instructionCount = 0) {
    return Promise.resolve().then(() => {
      if (this.isNavigating && !instructionCount) {
        return;
      }

      let instruction = this.queue.shift();
      this.queue = [];

      if (!instruction) {
        return;
      }

      this.isNavigating = true;

      if (!instructionCount) {
        this.events.publish('router:navigation:processing', { instruction });
      } else if (instructionCount > this.maxInstructionCount) {
        throw new Error(`Maximum navigation attempts exceeded. ${this.maxInstructionCount} navigation instructions have been attempted without success. Giving up.`);
      }

      let context = this.createNavigationContext(instruction);
      let pipeline = this.pipelineProvider.createPipeline(context);

      return pipeline
        .run(context)
        .then(result => processResult(instruction, result, instructionCount, this))
        .catch(error => {
          return { output: error instanceof Error ? error : new Error(error) };
        })
        .then(result => resolveInstruction(instruction, result, !!instructionCount, this));
    });
  }

  registerViewPort(viewPort, name) {
    super.registerViewPort(viewPort, name);

    if (!this.isActive) {
      if('configureRouter' in this.container.viewModel){
        var config = new RouterConfiguration();
        var result = Promise.resolve(this.container.viewModel.configureRouter(config, this));

        return result.then(() => {
          this.configure(config);
          this.activate();
        });
      }else{
        this.activate();
      }
    } else {
      this.dequeueInstruction();
    }
  }

  activate(options) {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
    this.history.activate(this.options);
    this.dequeueInstruction();
  }

  deactivate() {
    this.isActive = false;
    this.history.deactivate();
  }

  reset() {
    super.reset();
    this.queue = [];
    this.options = null;
  }
}

function findAnchor(el) {
  while (el) {
    if (el.tagName === "A") return el;
    el = el.parentNode;
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

      // Ensure the protocol is not part of URL, meaning its relative.
      // Stop the event bubbling to ensure the link will not cause a page refresh.
      if (href !== null && !(href.charAt(0) === "#" || (/^[a-z]+:/i).test(href))) {
        evt.preventDefault();
        this.history.navigate(href);
      }
    }
  }
}

function targetIsThisWindow(target) {
  var targetWindow = target.getAttribute('target');

  return !targetWindow ||
    targetWindow === window.name ||
    targetWindow === '_self' ||
    (targetWindow === 'top' && window === window.top);
}

function processResult(instruction, result, instructionCount, router) {
  if (!(result && 'completed' in result && 'output' in result)) {
    resut = result || {};
    result.output = new Error(`Expected router pipeline to return a navigation result, but got [${JSON.stringify(result)}] instead.`);
  }

  let finalResult = null;
  if (isNavigationCommand(result.output)) {
    result.output.navigate(router);
  } else {
    finalResult = result;

    if (!result.completed) {
      restorePreviousLocation(router);
    }
  }

  return router.dequeueInstruction(instructionCount + 1)
    .then(innerResult => finalResult || innerResult || result);
}

function resolveInstruction(instruction, result, isInnerInstruction, router) {
  instruction.resolve(result);

  if (!isInnerInstruction) {
    router.isNavigating = false;
    let eventArgs = { instruction, result };
    let eventName;

    if (result.output instanceof Error) {
      eventName = 'error';
    } else if (!result.completed) {
      eventName = 'canceled';
    } else {
      let queryString = instruction.queryString ? ('?' + instruction.queryString) : '';
      router.history.previousLocation = instruction.fragment + queryString;
      eventName = 'success';
    }

    router.events.publish(`router:navigation:${eventName}`, eventArgs);
    router.events.publish('router:navigation:complete', eventArgs);
  }

  return result;
}

function restorePreviousLocation(router) {
  let previousLocation = router.history.previousLocation;
  if (previousLocation) {
    router.navigate(router.history.previousLocation, false);
  } else {
    console.error('Router navigation failed, and no previous location could be restored.');
  }
}
