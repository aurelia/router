import { Router, AppRouter, PipelineProvider, ViewPortInstruction, ViewPort } from '../../../src/index';
import { History } from 'aurelia-history';
import { MockHistory } from '../../shared';
import { Container } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

describe('ROUTER -- DEFAULT VIEWPORTS -- UNIT', () => {

  let container: Container;
  let router: Router;
  let history: History;
  let absoluteRoot = 'https://github.com/aurelia';

  beforeEach(function __setup__() {
    container = new Container();
    history = new MockHistory(absoluteRoot);
    router = new AppRouter(
      container,
      history,
      new PipelineProvider(container),
      container.get(EventAggregator)
    );
  });

  it('register default viewports', () => {
    const aModuleId = {};
    const bViewModel = {};

    const vpA = { get moduleId() { return aModuleId; } } as ViewPortInstruction;
    const vpB = { get viewModel() { return bViewModel; } } as ViewPortInstruction;
    router.useViewPortDefaults({
      a: vpA,
      b: vpB
    });

    let A = router.viewPortDefaults.a;
    let B = router.viewPortDefaults.b;

    expect(A.moduleId).toBe(aModuleId as any);
    expect(B.viewModel).toBe(bViewModel);

    // ensure copy
    expect(A).not.toBe(vpA);
    expect(B).not.toBe(vpB);
  });
});
