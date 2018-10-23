import { Container } from 'aurelia-dependency-injection';
import {
  Router,
  RouteConfig,
  PipelineProvider,
  AppRouter,
  RouteLoader,
  Pipeline,
  NavigationInstruction,
  ViewPortComponent,
  NavigationCommand,
  Next,
  RouterConfiguration,
  ViewPortInstruction,
  ViewPort,
  PipelineStep
} from '../src';
import { MockHistory, MockInstruction } from './shared';
import { EventAggregator } from 'aurelia-event-aggregator';
import { History } from 'aurelia-history';

declare module 'aurelia-history' {
  interface History {
    previousLocation: string;
  }
}


class MockLoader extends RouteLoader {
  loadRoute(router: Router, config: RouteConfig): Promise<ViewPortComponent> {
    return Promise.resolve({
      viewModel: {}
    } as ViewPortComponent);
  }
}

describe('app-router', function AppRouter_Tests() {
  let router: AppRouter;
  let history: History;
  let ea: EventAggregator;
  let viewPort: ViewPort;
  let container: Container;
  let instruction: NavigationInstruction;
  let provider: PipelineProvider;
  let pipelineStep: PipelineStep['run'];

  beforeEach(() => {
    history = new MockHistory();
    container = new Container();
    container.registerSingleton(RouteLoader, MockLoader);
    // tslint:disable-next-line
    ea = { publish() { } } as any;
    viewPort = {
      process(viewPortInstruction: ViewPortInstruction) {
        return Promise.resolve();
      },
      // tslint:disable-next-line
      swap() { }
    } as any;

    // tslint:disable-next-line
    instruction = { resolve() { } } as any;
    provider = {
      createPipeline() {
        let p = new Pipeline();
        p.addStep({ run(inst, next) { return pipelineStep(inst, next); } });
        return p;
      }
    } as any;

    router = new AppRouter(container, history, provider, ea);
  });

  it('configures from root view model configureRouter method', (done) => {
    let routeConfig: RouteConfig = { route: '', moduleId: './test' };
    let viewModel = {
      configureRouter(config: RouterConfiguration) {
        config.map([routeConfig]);
      }
    };

    spyOn(viewModel, 'configureRouter').and.callThrough();

    container.viewModel = viewModel;

    expect(router.isConfigured).toBe(false);
    expect(router.routes.length).toBe(0);

    Promise.resolve(router.registerViewPort(viewPort))
      .then(result => {
        expect(viewModel.configureRouter).toHaveBeenCalled();
        expect(router.isConfigured).toBe(true);
        expect(router.routes.length).toBe(1);
        expect(router.routes[0] as Required<RouteConfig>).toEqual(jasmine.objectContaining(routeConfig as Required<RouteConfig>));
        done();
      });
  });

  it('configures only once with multiple viewPorts', (done) => {
    let routeConfig = { route: '', moduleId: './test' };
    let viewModel = {
      configureRouter(config: RouterConfiguration) {
        config.map([routeConfig]);
      }
    };

    spyOn(viewModel, 'configureRouter').and.callThrough();

    container.viewModel = viewModel;

    Promise
      .all([
        router.registerViewPort(viewPort),
        router.registerViewPort(viewPort, 'second')
      ])
      .then((result: any[]) => {
        expect((viewModel.configureRouter as jasmine.Spy).calls.count()).toBe(1);
        expect(router.isConfigured).toBe(true);
        expect(router.routes.length).toBe(1);
        done();
      });
  });

  describe('dequeueInstruction', function DequeueInstruction_Tests() {
    let processingResult: any;
    let completedResult: any;

    beforeEach(() => {
      router._queue.push(instruction);

      spyOn(ea, 'publish');
      processingResult = jasmine.objectContaining({ instruction });
      completedResult = jasmine.objectContaining({ instruction, result: jasmine.objectContaining({}) });
    });

    it('triggers events on successful navigations', (done) => {
      pipelineStep = (ctx: any, next: Next) => next.complete({});

      router
        ._dequeueInstruction()
        .then(result => {
          expect(ea.publish).toHaveBeenCalledWith('router:navigation:processing', processingResult);
          expect(ea.publish).toHaveBeenCalledWith('router:navigation:success', completedResult);
          expect(ea.publish).toHaveBeenCalledWith('router:navigation:complete', completedResult);
        })
        .catch(expectSuccess)
        .then(done);
    });

    it('returns expected results from successful navigations', (done) => {
      let output = {};
      pipelineStep = (ctx: any, next: Next) => next.complete(output);

      router
        ._dequeueInstruction()
        .then(result => {
          expect(result.completed).toBe(true);
          expect(result.status).toBe('completed');
          expect(result.output).toBe(output);
        })
        .catch(expectSuccess)
        .then(done);
    });

    it('triggers events on canceled navigations', (done) => {
      pipelineStep = (ctx: any, next: Next) => next.cancel('test');

      router
        ._dequeueInstruction()
        .then(result => {
          expect(ea.publish).toHaveBeenCalledWith('router:navigation:processing', processingResult);
          expect(ea.publish).toHaveBeenCalledWith('router:navigation:canceled', completedResult);
          expect(ea.publish).toHaveBeenCalledWith('router:navigation:complete', completedResult);
        })
        .catch(expectSuccess)
        .then(done);
    });

    it('returns expected results from canceled navigations', (done) => {
      let output = {};
      pipelineStep = (ctx: any, next: Next) => next.cancel(output);

      router._dequeueInstruction()
        .then(result => {
          expect(result.completed).toBe(false);
          expect(result.status).toBe('canceled');
          expect(result.output).toBe(output);
        })
        .catch(expectSuccess)
        .then(done);
    });

    it('triggers events on error navigations', (done) => {
      pipelineStep = (ctx: any, next: Next) => { throw new Error('test'); };

      router
        ._dequeueInstruction()
        .then(result => {
          expect(ea.publish).toHaveBeenCalledWith('router:navigation:processing', processingResult);
          expect(ea.publish).toHaveBeenCalledWith('router:navigation:error', completedResult);
          expect(ea.publish).toHaveBeenCalledWith('router:navigation:complete', completedResult);
        })
        .catch(expectSuccess)
        .then(done);
    });

    it('returns expected results from error navigations', (done) => {
      let output = new Error('test');
      pipelineStep = (ctx: any, next: Next) => next.reject(output);

      router._dequeueInstruction()
        .then(result => {
          expect(result.completed).toBe(false);
          expect(result.status).toBe('rejected');
          expect(result.output).toBe(output);
        })
        .catch(expectSuccess)
        .then(done);
    });
  });

  describe('loadUrl', function LoadUrl_Tests() {
    it('restores previous location when route not found', (done) => {
      spyOn(history, 'navigate');

      router.history.previousLocation = 'prev';
      router.loadUrl('next')
        .then(result => {
          expect(result).toBeFalsy();
          expect(history.navigate).toHaveBeenCalledWith('#/prev', { trigger: false, replace: true });
        })
        .catch(() => expect(true).toBeFalsy('should have succeeded'))
        .then(done);
    });

    it('navigate to fallback route when route not found and there is no previous location', (done) => {
      spyOn(history, 'navigate');

      router.history.previousLocation = null;
      router.fallbackRoute = 'fallback';
      router.loadUrl('next')
        .then(result => {
          expect(result).toBeFalsy();
          expect(history.navigate).toHaveBeenCalledWith('#/fallback', { trigger: true, replace: true });
        })
        .catch(result => expect(true).toBeFalsy('should have succeeded'))
        .then(done);
    });

    it('restores previous location on error', (done) => {
      spyOn(history, 'navigate');

      router.history.previousLocation = 'prev';
      router.activate();
      router.configure(config => {
        config.map([
          { name: 'test', route: '', moduleId: './test' }
        ]);
        return config;
      });

      router.loadUrl('next')
        .then(result => {
          expect(result).toBeFalsy();
          expect(history.navigate).toHaveBeenCalledWith('#/prev', { trigger: false, replace: true });
        })
        .catch(() => expect(true).toBeFalsy('should have succeeded'))
        .then(done);
    });
  });

  describe('instruction completes as navigation command', function InstructionCompletion_Tests () {
    it('should complete instructions in order before terminating', done => {
      const pipeline = new Pipeline()
        .addStep({ run(inst: NavigationInstruction, next: Next) { return pipelineStep(inst, next); } });
      spyOn(pipeline, 'run').and.callThrough();

      const plProvider: PipelineProvider = {
        createPipeline: () => pipeline
      } as PipelineProvider;
      const router = new AppRouter(container, history, plProvider, ea);
      const initialInstruction = new MockInstruction('initial resulting navigation (Promise)');
      const instructionAfterNav = new MockInstruction('instruction after navigation');

      const navigationCommand: NavigationCommand = {
        navigate: () => new Promise(resolve => {
          setTimeout(() => {
            router._queue.push(instructionAfterNav);
            pipelineStep = (ctx: any, next: Next) => next.complete({});
            resolve();
          }, 0);
        })
      };

      router._queue.push(initialInstruction);
      pipelineStep = (ctx: any, next: Next) => next.complete(navigationCommand);

      router._dequeueInstruction()
        .then(_ => {
          expect(pipeline.run).toHaveBeenCalledTimes(2);
          expect((pipeline.run as jasmine.Spy).calls.argsFor(0)).toEqual([initialInstruction]);
          expect((pipeline.run as jasmine.Spy).calls.argsFor(1)).toEqual([instructionAfterNav]);
          done();
        });
    });
  });
});

function expectSuccess(result: any) {
  expect(result).not.toBe(result, 'should have succeeded');
}
