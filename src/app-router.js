import * as LogManager from 'aurelia-logging';
import {Container} from 'aurelia-dependency-injection';
import {History} from 'aurelia-history';
import {Router} from './router';
import {PipelineProvider} from './pipeline-provider';
import {isNavigationCommand} from './navigation-commands';
import {EventAggregator} from 'aurelia-event-aggregator';

const logger = LogManager.getLogger('app-router');

/**
* The main application router.
*/
export class AppRouter extends Router {
  static inject() { return [Container, History, PipelineProvider, EventAggregator]; }

  constructor(container: Container, history: History, pipelineProvider: PipelineProvider, events: EventAggregator) {
    super(container, history); //Note the super will call reset internally.
    this.pipelineProvider = pipelineProvider;
    this.events = events;
  }

  /**
  * Fully resets the router's internal state. Primarily used internally by the framework when multiple calls to setRoot are made.
  * Use with caution (actually, avoid using this). Do not use this to simply change your navigation model.
  */
  reset() {
    super.reset();
    this.maxInstructionCount = 10;
    if (!this._queue) {
      this._queue = [];
    } else {
      this._queue.length = 0;
    }
  }

  /**
  * Loads the specified URL.
  *
  * @param url The URL fragment to load.
  */
  loadUrl(url): Promise<NavigationInstruction> {
    return this._createNavigationInstruction(url)
      .then(instruction => this._queueInstruction(instruction))
      .catch(error => {
        logger.error(error);
        restorePreviousLocation(this);
      });
  }

  /**
  * Registers a viewPort to be used as a rendering target for activated routes.
  *
  * @param viewPort The viewPort.
  * @param name The name of the viewPort. 'default' if unspecified.
  */
  registerViewPort(viewPort: any, name: string): Promise<any> {
    super.registerViewPort(viewPort, name);

    if (!this.isActive) {
      let viewModel = this._findViewModel(viewPort);
      if ('configureRouter' in viewModel) {
        if (!this.isConfigured) {
          let resolveConfiguredPromise = this._resolveConfiguredPromise;
          this._resolveConfiguredPromise = () => {};
          return this.configure(config => viewModel.configureRouter(config, this))
            .then(() => {
              this.activate();
              resolveConfiguredPromise();
            });
        }
      } else {
        this.activate();
      }
    } else {
      this._dequeueInstruction();
    }

    return Promise.resolve();
  }

  /**
  * Activates the router. This instructs the router to begin listening for history changes and processing instructions.
  *
  * @params options The set of options to activate the router with.
  */
  activate(options: Object): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
    this.history.activate(this.options);
    this._dequeueInstruction();
  }

  /**
  * Deactivates the router.
  */
  deactivate(): void {
    this.isActive = false;
    this.history.deactivate();
  }

  _queueInstruction(instruction: NavigationInstruction): Promise<any> {
    return new Promise((resolve) => {
      instruction.resolve = resolve;
      this._queue.unshift(instruction);
      this._dequeueInstruction();
    });
  }

  _dequeueInstruction(instructionCount: number = 0): Promise<any> {
    return Promise.resolve().then(() => {
      if (this.isNavigating && !instructionCount) {
        return undefined;
      }

      let instruction = this._queue.shift();
      this._queue.length = 0;

      if (!instruction) {
        return undefined;
      }

      this.isNavigating = true;

      let navtracker: number = this.history.getState('NavigationTracker');
      if (!navtracker && !this.currentNavigationTracker) {
        this.isNavigatingFirst = true;
        this.isNavigatingNew = true;
      } else if (!navtracker) {
        this.isNavigatingNew = true;
      } else if (!this.currentNavigationTracker) {
        this.isNavigatingRefresh = true;
      } else if (this.currentNavigationTracker < navtracker) {
        this.isNavigatingForward = true;
      } else if (this.currentNavigationTracker > navtracker) {
        this.isNavigatingBack = true;
      } if (!navtracker) {
        navtracker = Date.now();
        this.history.setState('NavigationTracker', navtracker);
      }
      this.currentNavigationTracker = navtracker;

      instruction.previousInstruction = this.currentInstruction;

      if (!instructionCount) {
        this.events.publish('router:navigation:processing', { instruction });
      } else if (instructionCount === this.maxInstructionCount - 1) {
        logger.error(`${instructionCount + 1} navigation instructions have been attempted without success. Restoring last known good location.`);
        restorePreviousLocation(this);
        return this._dequeueInstruction(instructionCount + 1);
      } else if (instructionCount > this.maxInstructionCount) {
        throw new Error('Maximum navigation attempts exceeded. Giving up.');
      }

      let pipeline = this.pipelineProvider.createPipeline(!this.couldDeactivate);

      return pipeline
        .run(instruction)
        .then(result => processResult(instruction, result, instructionCount, this))
        .catch(error => {
          return { output: error instanceof Error ? error : new Error(error) };
        })
        .then(result => resolveInstruction(instruction, result, !!instructionCount, this));
    });
  }

  _findViewModel(viewPort: Object): Object {
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

    return undefined;
  }
}

function processResult(instruction, result, instructionCount, router) {
  if (!(result && 'completed' in result && 'output' in result)) {
    result = result || {};
    result.output = new Error(`Expected router pipeline to return a navigation result, but got [${JSON.stringify(result)}] instead.`);
  }

  let finalResult = null;
  let navigationCommandResult = null;
  if (isNavigationCommand(result.output)) {
    navigationCommandResult = result.output.navigate(router);
  } else {
    finalResult = result;

    if (!result.completed) {
      if (result.output instanceof Error) {
        logger.error(result.output);
      }

      restorePreviousLocation(router);
    }
  }

  return Promise.resolve(navigationCommandResult)
    .then(_ => router._dequeueInstruction(instructionCount + 1))
    .then(innerResult => finalResult || innerResult || result);
}

function resolveInstruction(instruction, result, isInnerInstruction, router) {
  instruction.resolve(result);

  let eventArgs = { instruction, result };
  if (!isInnerInstruction) {
    router.isNavigating = false;
    router.isExplicitNavigation = false;
    router.isExplicitNavigationBack = false;
    router.isNavigatingFirst = false;
    router.isNavigatingNew = false;
    router.isNavigatingRefresh = false;
    router.isNavigatingForward = false;
    router.isNavigatingBack = false;
    router.couldDeactivate = false;

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
  } else {
    router.events.publish('router:navigation:child:complete', eventArgs);
  }

  return result;
}

function restorePreviousLocation(router) {
  let previousLocation = router.history.previousLocation;
  if (previousLocation) {
    router.navigate(router.history.previousLocation, { trigger: false, replace: true });
  } else if (router.fallbackRoute) {
    router.navigate(router.fallbackRoute, { trigger: true, replace: true });
  } else {
    logger.error('Router navigation failed, and no previous location or fallbackRoute could be restored.');
  }
}
