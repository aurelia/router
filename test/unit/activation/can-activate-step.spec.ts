import { activationStrategy, ActivationStrategy, CanActivateNextStep, NavigationInstruction } from '../../../src';
import { createPipelineState, MockPipelineState, ValueOf } from '../../shared';

describe('Activation -- CanActivateNextStep', function CanActivateNextStep__Tests() {
  let step: CanActivateNextStep;
  let state: MockPipelineState;

  function getNavigationInstruction(
    canActivateHandler: () => any,
    strategy: ValueOf<ActivationStrategy> = activationStrategy.invokeLifecycle
  ): NavigationInstruction {
    return {
      plan: {
        default: {
          strategy: strategy
        }
      },
      viewPortInstructions: {
        default: {
          component: { viewModel: { canActivate: canActivateHandler } },
          lifecycleArgs: []
        }
      }
    } as any;
  }

  beforeEach(() => {
    step = new CanActivateNextStep();
    state = createPipelineState();
  });

  it('should return true for context that canActivate', () => {
    let instruction = getNavigationInstruction(() => true);

    step.run(instruction, state.next);
    expect(state.result).toBe(true);
  });

  it('should return true for context that canActivate with activationStrategy.replace', () => {
    let instruction = getNavigationInstruction(() => true, activationStrategy.replace);

    step.run(instruction, state.next);
    expect(state.result).toBe(true);
  });

  it('should cancel for context that cannot activate', () => {
    let instruction = getNavigationInstruction(() => false);

    step.run(instruction, state.next);
    expect(state.rejection).toBeTruthy();
  });
});
