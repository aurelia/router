import '../setup';
import { Container } from 'aurelia-dependency-injection';
import { LoadRouteStep, RouteLoader } from '../../src/route-loading';
import { NavigationInstruction, Next, PipelineResult, activationStrategy, RouteConfig } from '../../src/aurelia-router';
import { createNextFn } from '../../src/next';
import { PipelineStatus } from '../../src/pipeline-status';

describe('RouteLoading -- LoadRouteStep', function() {
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
        config: {} as RouteConfig
      }
    };
    next = createNextFn(navInstruction, [loadRouteStep.run.bind(loadRouteStep)]);
  });

  it('without RouteLoader implementation -- wrapped in Promise', async () => {
    const result: PipelineResult = await loadRouteStep.run(navInstruction, next);
    expect(result.status).toBe(PipelineStatus.Canceled);
    expect(result.output.toString()).toBe(new Error('Route loaders must implement "loadRoute(router, config, navigationInstruction)".').toString());
  });
});
