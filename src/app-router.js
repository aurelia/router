import 'core-js';
import * as LogManager from 'aurelia-logging';
import {Container} from 'aurelia-dependency-injection';
import {History} from 'aurelia-history';
import {Router} from './router';
import {PipelineProvider} from './pipeline-provider';
import {isNavigationCommand} from './navigation-commands';
import {EventAggregator} from 'aurelia-event-aggregator';
import {RouterConfiguration} from './router-configuration';

const logger = LogManager.getLogger('app-router');

export class AppRouter extends Router {
  static inject() { return [Container, History, PipelineProvider, EventAggregator]; }

  constructor(container: Container, history: History, pipelineProvider: PipelineProvider, events: EventAggregator) {
    super(container, history);
    this.pipelineProvider = pipelineProvider;
    document.addEventListener('click', handleLinkClick.bind(this), true);
    this.events = events;
    this.maxInstructionCount = 10;
  }

  get isRoot(): boolean {
    return true;
  }

  loadUrl(url): Promise<NavigationInstruction> {
    return this.createNavigationInstruction(url)
      .then(instruction => this.queueInstruction(instruction))
      .catch(error => {
        logger.error(error);
        restorePreviousLocation(this);
      });
  }

  queueInstruction(instruction: NavigationInstruction): Promise<any> {
    return new Promise((resolve) => {
      instruction.resolve = resolve;
      this.queue.unshift(instruction);
      this.dequeueInstruction();
    });
  }

  dequeueInstruction(instructionCount: number = 0): Promise<any> {
    return Promise.resolve().then(() => {
      if (this.isNavigating && !instructionCount) {
        return undefined;
      }

      let instruction = this.queue.shift();
      this.queue = [];

      if (!instruction) {
        return undefined;
      }

      this.isNavigating = true;

      if (!instructionCount) {
        this.events.publish('router:navigation:processing', { instruction });
      } else if (instructionCount === this.maxInstructionCount - 1) {
        logger.error(`${instructionCount + 1} navigation instructions have been attempted without success. Restoring last known good location.`);
        restorePreviousLocation(this);
        return this.dequeueInstruction(instructionCount + 1);
      } else if (instructionCount > this.maxInstructionCount) {
        throw new Error(`Maximum navigation attempts exceeded. Giving up.`);
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

  registerViewPort(viewPort: Object, name: string): void {
    super.registerViewPort(viewPort, name);

    if (!this.isActive) {
      let viewModel = this._findViewModel(viewPort);

      if ('configureRouter' in viewModel) {
        let config = new RouterConfiguration();
        let result = Promise.resolve(viewModel.configureRouter(config, this));

        return result.then(() => {
          this.configure(config);
          this.activate();
        });
      }

      this.activate();
    } else {
      this.dequeueInstruction();
    }
  }

  _findViewModel(viewPort: Object) {
    if (this.container.viewModel) {
      return this.container.viewModel;
    }

    if (viewPort.container) {
      let container = viewPort.container;

      while (container) {
        if (container.viewModel) {
          this.container.viewModel = container.viewModel;
          return container.viewModel;
        }

        container = container.parent;
      }
    }
  }

  activate(options: Object): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
    this.history.activate(this.options);
    this.dequeueInstruction();
  }

  deactivate(): void {
    this.isActive = false;
    this.history.deactivate();
  }

  reset(): void {
    super.reset();
    this.queue = [];
    this.options = null;
  }
}

function findAnchor(el) {
  while (el) {
    if (el.tagName === 'A') {
      return el;
    }

    el = el.parentNode;
  }
}

function handleLinkClick(evt) {
  if (!this.isActive) {
    return;
  }

  let target = findAnchor(evt.target);
  if (!target) {
    return;
  }

  if (this.history._hasPushState) {
    if (!evt.altKey && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey && targetIsThisWindow(target)) {
      let href = target.getAttribute('href');

      // Ensure the protocol is not part of URL, meaning its relative.
      // Stop the event bubbling to ensure the link will not cause a page refresh.
      if (href !== null && !(href.charAt(0) === '#' || (/^[a-z]+:/i).test(href))) {
        evt.preventDefault();
        this.history.navigate(href);
      }
    }
  }
}

function targetIsThisWindow(target) {
  let targetWindow = target.getAttribute('target');

  return !targetWindow ||
    targetWindow === window.name ||
    targetWindow === '_self' ||
    (targetWindow === 'top' && window === window.top);
}

function processResult(instruction, result, instructionCount, router) {
  if (!(result && 'completed' in result && 'output' in result)) {
    result = result || {};
    result.output = new Error(`Expected router pipeline to return a navigation result, but got [${JSON.stringify(result)}] instead.`);
  }

  let finalResult = null;
  if (isNavigationCommand(result.output)) {
    result.output.navigate(router);
  } else {
    finalResult = result;

    if (!result.completed) {
      if (result.output instanceof Error) {
        logger.error(result.output);
      }

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
    router.navigate(router.history.previousLocation, { trigger: false, replace: true });
  } else {
    logger.error('Router navigation failed, and no previous location could be restored.');
  }
}
