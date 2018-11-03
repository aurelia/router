import { ActivateNextStep, activationStrategy, NavigationInstruction, RouteConfig, ViewPortInstruction } from '../../../src';
import { createPipelineState, MockPipelineState } from '../../shared';

describe('Activation -- ActivateNextStep', function _3_ActivateNextStep__Tests() {
  let step: ActivateNextStep;
  let state: MockPipelineState;

  beforeEach(() => {
    step = new ActivateNextStep();
    state = createPipelineState();
  });

  it('should pass current viewport name to activate', (done) => {
    const instruction = new NavigationInstruction({
      plan: {
        'my-view-port': { strategy: activationStrategy.invokeLifecycle } as ViewPortInstruction
      }
    } as any);

    const viewModel = {
      activate(params: Record<string, any>, config: RouteConfig, instruction: NavigationInstruction) {
        expect(config.currentViewPort).toBe('my-view-port');
        done();
      }
    };

    instruction.addViewPortInstruction('my-view-port', 'ignored' as any, 'ignored', { viewModel });
    step.run(instruction, state.next);
  });
});
