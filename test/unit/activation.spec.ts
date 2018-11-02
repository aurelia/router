import {
  Router,
  activationStrategy,
  ActivationStrategy,
  NavigationInstruction,
  ViewPortInstruction,
  RouteConfig,
  CanDeactivatePreviousStep,
  CanActivateNextStep,
  ActivateNextStep,
  NavigationInstructionInit,
  ViewPortPlan
} from '../../src';
import { ValueOf, createPipelineState, MockPipelineState, MockInstruction } from '../shared';

describe('activation', function activation__Tests() {
  describe('CanDeactivatePreviousStep', function CanDeactivatePreviousStep__Tests() {
    let step: CanDeactivatePreviousStep;
    let state: MockPipelineState;

    let viewPortPlanFactory = (
      resultHandler: (val?: any) => any,
      strategy: ValueOf<ActivationStrategy> = activationStrategy.invokeLifecycle
    ): ViewPortPlan => {
      return {
        strategy: strategy,
        prevComponent: {
          viewModel: { canDeactivate: resultHandler },
          childRouter: null as Router
        }
      } as ViewPortPlan;
    };

    let instructionFactory = (instruction: Partial<NavigationInstruction>): NavigationInstruction => {
      return Object.assign({ router: {} }, instruction as NavigationInstruction);
    };

    beforeEach(function __setup__() {
      step = new CanDeactivatePreviousStep();
      state = createPipelineState();
    });

    it('should return true for context that canDeactivate', () => {
      let instruction: NavigationInstruction = instructionFactory({ plan: { first: viewPortPlanFactory(() => (true)) } } as any);

      step.run(instruction, state.next);
      expect(state.result).toBe(true);
    });

    it('should return true for context that canDeactivate with activationStrategy.replace', () => {
      let instruction: NavigationInstruction = instructionFactory({
        plan: {
          first: viewPortPlanFactory(
            () => (true),
            activationStrategy.replace
          )
        }
      });

      step.run(instruction, state.next);
      expect(state.result).toBe(true);
    });

    it('should cancel for context that cannot Deactivate', () => {
      let instruction: NavigationInstruction = instructionFactory({
        plan: {
          first: viewPortPlanFactory(() => false)
        }
      });

      step.run(instruction, state.next);
      expect(state.rejection).toBeTruthy();
    });

    it('should return true for context that cannot Deactivate with unknown strategy', () => {
      let instruction: NavigationInstruction = instructionFactory({
        plan: {
          first: viewPortPlanFactory(() => false, 'unknown' as any)
        }
      });

      step.run(instruction, state.next);
      expect(state.result).toBe(true);
    });


    it('should return true for context that canDeactivate with a promise', (done) => {
      let instruction: NavigationInstruction = instructionFactory({
        plan: {
          first: viewPortPlanFactory(() => Promise.resolve(true))
        }
      });

      step.run(instruction, state.next).then(() => {
        expect(state.result).toBe(true);
        done();
      });
    });

    it('should cancel for context that cantDeactivate with a promise', (done) => {
      let instruction: NavigationInstruction = instructionFactory({
        plan: {
          first: viewPortPlanFactory(() => Promise.resolve(false))
        }
      });

      step.run(instruction, state.next).then(() => {
        expect(state.rejection).toBeTruthy();
        done();
      });
    });

    it('should cancel for context that throws in canDeactivate', (done) => {
      let instruction: NavigationInstruction = instructionFactory({
        plan: {
          first: viewPortPlanFactory(() => { throw new Error('oops'); })
        }
      });

      step.run(instruction, state.next).then(() => {
        expect(state.rejection).toBeTruthy();
        done();
      });
    });

    it('should return true when all plans return true', () => {
      let instruction: NavigationInstruction = instructionFactory({
        plan: {
          first: viewPortPlanFactory(() => true),
          second: viewPortPlanFactory(() => true)
        }
      });

      step.run(instruction, state.next);
      expect(state.result).toBe(true);
    });

    it('should cancel when some plans return false', () => {
      let instruction: NavigationInstruction = instructionFactory({
        plan: {
          first: viewPortPlanFactory(() => true),
          second: viewPortPlanFactory(() => false)
        }
      });

      step.run(instruction, state.next);
      expect(state.rejection).toBeTruthy();
    });

    it('should pass a navigationInstruction to the callback function', () => {
      const instruction: NavigationInstruction = instructionFactory({
        plan: {
          first: viewPortPlanFactory(() => true)
        }
      });
      const viewModel = instruction.plan.first.prevComponent.viewModel;
      spyOn(viewModel, 'canDeactivate').and.callThrough();
      step.run(instruction, state.next);
      expect(viewModel.canDeactivate).toHaveBeenCalledWith(instruction);
    });

    describe('with a childNavigationInstruction', () => {
      let viewPort = viewPortPlanFactory(() => true);
      // let instruction: NavigationInstruction = { plan: { first: viewPort } } as any;

      describe('when navigating on the parent', () => {

        const viewPortInstructionFactory = (resultHandler: (val?: any) => any) => {
          return {
            component: { viewModel: { canDeactivate: resultHandler } }
          } as ViewPortInstruction;
        };

        it('should return true when the currentInstruction can deactivate', () => {
          let viewPort = viewPortPlanFactory(() => (true), activationStrategy.replace) as any;
          let currentInstruction: NavigationInstruction = instructionFactory({
            viewPortInstructions: {
              first: viewPortInstructionFactory(() => true)
            }
          });
          viewPort.prevComponent.childRouter = <Router>({ currentInstruction } as any);
          let instruction: NavigationInstruction = instructionFactory({
            plan: {
              first: viewPort
            }
          });
          step.run(instruction, state.next);
          expect(state.result).toBe(true);
        });

        it('should cancel when router instruction cannot deactivate', () => {
          let viewPort = viewPortPlanFactory(() => true, activationStrategy.replace);
          let currentInstruction: NavigationInstruction = instructionFactory({
            viewPortInstructions: {
              first: viewPortInstructionFactory(() => false)
            }
          });
          viewPort.prevComponent.childRouter = <Router>({ currentInstruction } as any);
          let instruction: NavigationInstruction = instructionFactory({
            plan: {
              first: viewPort
            }
          });
          step.run(instruction, state.next);
          expect(state.rejection).toBeTruthy();
        });

      });
    });
  });

  describe('CanActivateNextStep', function CanActivateNextStep__Tests() {
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

  describe('ActivateNextStep', function ActivateNextStep__Tests() {
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
});
