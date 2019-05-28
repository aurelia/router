import { Container } from 'aurelia-dependency-injection';
import { AppRouter, NavigationInstruction, Next, PipelineProvider, PipelineSlotName } from '../src/aurelia-router';

describe('app-router', () => {

  it('does not clear pipeline when invoking reset without params', async () => {
    let container = new Container();
    let pipelineProvider = container.get(PipelineProvider) as PipelineProvider;
    let appRouter = container.get(AppRouter) as AppRouter;
    const stepRunner = {
      run: (_: NavigationInstruction, next: Next) => {
        return next();
      }
    };

    appRouter.pipelineProvider.addStep(PipelineSlotName.Authorize, stepRunner);
    appRouter.reset();
    expect(pipelineProvider._findStep(PipelineSlotName.Authorize).steps[0]).toBe(stepRunner);
  });

  it('clears pipeline when invoking reset with clearPipeline option', async () => {
    let container = new Container();
    let pipelineProvider = container.get(PipelineProvider) as PipelineProvider;
    let appRouter = container.get(AppRouter) as AppRouter;
    const stepRunner = {
      run: (_: NavigationInstruction, next: Next) => {
        return next();
      }
    };

    appRouter.pipelineProvider.addStep(PipelineSlotName.Authorize, stepRunner);
    appRouter.reset({ clearPipeline: true });
    expect(pipelineProvider._findStep(PipelineSlotName.Authorize).steps.length).toBe(0, 'pipelineProvider no authorizeStep');
  });
});
