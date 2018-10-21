import * as LogManager from 'aurelia-logging';
import { Container } from 'aurelia-dependency-injection';
import { History, NavigationOptions } from 'aurelia-history';
import { Router } from './router';
import { PipelineProvider } from './pipeline-provider';
import { isNavigationCommand } from './navigation-commands';
import { EventAggregator } from 'aurelia-event-aggregator';
import { NavigationInstruction } from './navigation-instruction';
import { ViewPort, ConfiguresRouter, PipelineResult } from './interfaces';

/**@internal */
declare module 'aurelia-dependency-injection' {
  interface Container {
    viewModel?: any;
  }
}

const logger = LogManager.getLogger('app-router');

/**
* The main application router.
*/
export class AppRouter extends Router {

  /**@internal */
  static inject() { return [Container, History, PipelineProvider, EventAggregator]; }

  events: EventAggregator;
  /**@internal */
  maxInstructionCount: number;
  /**@internal */
  _queue: NavigationInstruction[];
  /**@internal */
  isActive: boolean;

  constructor(container: Container, history: History, pipelineProvider: PipelineProvider, events: EventAggregator) {
    super(container, history); // Note the super will call reset internally.
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
  loadUrl(url: string): Promise<NavigationInstruction> {
    return this
      ._createNavigationInstruction(url)
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
  registerViewPort(viewPort: any, name?: string): Promise<any> {
    super.registerViewPort(viewPort, name);

    if (!this.isActive) {
      const viewModel = this._findViewModel(viewPort);
      if ('configureRouter' in viewModel) {
        if (!this.isConfigured) {
          const resolveConfiguredPromise = this._resolveConfiguredPromise;
          // tslint:disable-next-line
          this._resolveConfiguredPromise = () => { };
          return this
            .configure(config => {
              viewModel.configureRouter(config, this);
              return config;
            })
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
  activate(options?: NavigationOptions): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    // route handler property is responsible for handling url change
    // the interface of aurelia-history isn't clear on this perspective
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

  /**@internal */
  _queueInstruction(instruction: NavigationInstruction): Promise<any> {
    return new Promise((resolve) => {
      instruction.resolve = resolve;
      this._queue.unshift(instruction);
      this._dequeueInstruction();
    });
  }

  /**@internal */
  async _dequeueInstruction(instructionCount: number = 0): Promise<PipelineResult | void> {
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
    }
    else if (!navtracker) {
      this.isNavigatingNew = true;
    }
    else if (!this.currentNavigationTracker) {
      this.isNavigatingRefresh = true;
    }
    else if (this.currentNavigationTracker < navtracker) {
      this.isNavigatingForward = true;
    }
    else if (this.currentNavigationTracker > navtracker) {
      this.isNavigatingBack = true;
    }
    if (!navtracker) {
      navtracker = Date.now();
      this.history.setState('NavigationTracker', navtracker);
    }
    this.currentNavigationTracker = navtracker;
    instruction.previousInstruction = this.currentInstruction;
    if (!instructionCount) {
      this.events.publish('router:navigation:processing', { instruction });
    }
    else if (instructionCount === this.maxInstructionCount - 1) {
      logger.error(`${instructionCount + 1} navigation instructions have been attempted without success. Restoring last known good location.`);
      restorePreviousLocation(this);
      return this._dequeueInstruction(instructionCount + 1);
    }
    else if (instructionCount > this.maxInstructionCount) {
      throw new Error('Maximum navigation attempts exceeded. Giving up.');
    }
    let pipeline = this.pipelineProvider.createPipeline(!this.couldDeactivate);
    let result: PipelineResult;
    try {
      const $result = await pipeline.run(instruction);
      result = await processResult(instruction, $result, instructionCount, this);
    } catch (error) {
      result = ({ output: error instanceof Error ? error : new Error(error) } as PipelineResult);
    }
    return resolveInstruction(instruction, result, !!instructionCount, this);
  }

  /**@internal */
  _findViewModel(viewPort: ViewPort): ConfiguresRouter | undefined {
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

function processResult(
  instruction: NavigationInstruction,
  result: PipelineResult,
  instructionCount: number,
  router: AppRouter
) {
  if (!(result && 'completed' in result && 'output' in result)) {
    result = result || {} as PipelineResult;
    result.output = new Error(`Expected router pipeline to return a navigation result, but got [${JSON.stringify(result)}] instead.`);
  }

  let finalResult: PipelineResult = null;
  let navigationCommandResult = null;
  if (isNavigationCommand(result.output)) {
    navigationCommandResult = result.output.navigate(router);
  } else {
    finalResult = result;

    if (!result.completed) {
      if (result.output instanceof Error) {
        logger.error(result.output.toString());
      }

      restorePreviousLocation(router);
    }
  }

  return Promise.resolve(navigationCommandResult)
    .then(_ => router._dequeueInstruction(instructionCount + 1))
    .then(innerResult => finalResult || innerResult || result);
}

function resolveInstruction(
  instruction: NavigationInstruction,
  result: PipelineResult,
  isInnerInstruction: boolean,
  router: AppRouter
) {
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

    let eventName: string;

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

function restorePreviousLocation(router: AppRouter) {
  let previousLocation = router.history.previousLocation;
  if (previousLocation) {
    router.navigate(router.history.previousLocation, { trigger: false, replace: true });
  } else if (router.fallbackRoute) {
    router.navigate(router.fallbackRoute, { trigger: true, replace: true });
  } else {
    logger.error('Router navigation failed, and no previous location or fallbackRoute could be restored.');
  }
}
