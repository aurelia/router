import { Container } from 'aurelia-dependency-injection';
import { LoadRouteStep, RouteLoader } from '../../../src/route-loading';
import { NavigationInstruction, Next, PipelineResult, pipelineStatus, activationStrategy } from '../../../src';
import { createNextFn } from '../../../src/next';

describe('RouteLoading -- LoadRouteStep', function _2_LoadRouteStep__Tests() {
  let container: Container;
  let navInstruction: NavigationInstruction;
  let loadRouteStep: LoadRouteStep;
  let next: Next;
  let nextResult: PipelineResult;

  beforeEach(function __setup__() {
    container = new Container();
    loadRouteStep = container.get(LoadRouteStep);
    navInstruction = {
      addViewPortInstruction(name: string = 'default', config = {}) {
        return {
          name,
          config
        };
      }
    } as any;
    navInstruction.plan = {
      default: {
        strategy: activationStrategy.replace,
        name: 'default',
        config: {}
      }
    };
    next = createNextFn(navInstruction, [loadRouteStep.run.bind(loadRouteStep)]);
  });

  it('throws when there is no proper RouteLoader implementation', async () => {
    const result: PipelineResult = await loadRouteStep.run(navInstruction, next);
    expect(result.status).toBe(pipelineStatus.canceled);
    expect(result.output.toString()).toBe(new Error('Route loaders must implement "loadRoute(router, config, navigationInstruction)".').toString());
  });

  it('does not throw when there is proper RouteLoader implementation', async () => {
    // let loaded = 0;
    // let route = { moduleId: '', router: {}, config: {}, viewModel: {} };
    // container = new Container();
    // container.registerInstance(RouteLoader, {
    //   loadRoute() {
    //     loaded = 1;
    //     return Promise.resolve();
    //   }
    // });
    // loadRouteStep = container.get(LoadRouteStep);
    // next = createNext(navInstruction, [loadRouteStep.run.bind(loadRouteStep)]);
    // const result: PipelineResult = await loadRouteStep.run(navInstruction, next);
    // expect(loaded).toBe(1);
    // // expect(result.status).toBe(pipelineStatus.completed);
    // expect(result.output).toBe(route);
  });
});
