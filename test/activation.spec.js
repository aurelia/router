import {
  CanDeactivatePreviousStep,
  CanActivateNextStep,
  ActivateNextStep
} from '../src/activation';
import {activationStrategy} from '../src/navigation-plan';
import {NavigationInstruction} from '../src/navigation-instruction';
import {createPipelineState} from './test-util';

describe('activation', () => {
  describe('CanDeactivatePreviousStep', () => {
    let step;
    let state;

    let viewPortFactory = (resultHandler, strategy = activationStrategy.invokeLifecycle) => {
      return {
        strategy: strategy,
        prevComponent: { viewModel: { canDeactivate: resultHandler } }
      };
    };

    let instructionFactory = (instruction) => {
      return Object.assign({ router: {} }, instruction);
    }

    beforeEach(() => {
      step = new CanDeactivatePreviousStep();
      state = createPipelineState();
    });

    it('should return true for context that canDeactivate', () => {
      let instruction = instructionFactory({ plan: { first: viewPortFactory(() => (true)) } });

      step.run(instruction, state.next);
      expect(state.result).toBe(true);
    });

    it('should return true for context that canDeactivate with activationStrategy.replace', () => {
      let instruction = instructionFactory({ plan: { first: viewPortFactory(() => (true), activationStrategy.replace) } });

      step.run(instruction, state.next);
      expect(state.result).toBe(true);
    });

    it('should cancel for context that cannot Deactivate', () => {
      let instruction = instructionFactory({ plan: { first: viewPortFactory(() => (false)) } });

      step.run(instruction, state.next);
      expect(state.rejection).toBeTruthy();
    });

    it('should return true for context that cannot Deactivate with unknown strategy', () => {
      let instruction = instructionFactory({ plan: { first: viewPortFactory(() => (false), 'unknown') } });

      step.run(instruction, state.next);
      expect(state.result).toBe(true);
    });


    it('should return true for context that canDeactivate with a promise', (done) => {
      let instruction = instructionFactory({ plan: {first: viewPortFactory(() => (Promise.resolve(true))) } });

      step.run(instruction, state.next).then(() => {
        expect(state.result).toBe(true);
        done();
      });
    });

    it('should cancel for context that cantDeactivate with a promise', (done) => {
      let instruction = instructionFactory({ plan: {first: viewPortFactory(() => (Promise.resolve(false))) } });

      step.run(instruction, state.next).then(() => {
        expect(state.rejection).toBeTruthy();
        done();
      });
    });

    it('should cancel for context that throws in canDeactivate', (done) => {
      let instruction = instructionFactory({ plan: {first: viewPortFactory(() => { throw new Error('oops'); }) } });

      step.run(instruction, state.next).then(() => {
        expect(state.rejection).toBeTruthy();
        done();
      });
    });

    it('should return true when all plans return true', () => {
      let instruction = instructionFactory({ plan: { first: viewPortFactory(() => (true)), second: viewPortFactory(() => (true))} });

      step.run(instruction, state.next);
      expect(state.result).toBe(true);
    });

    it('should cancel when some plans return false', () => {
      let instruction = instructionFactory({ plan: {first: viewPortFactory(() => (true)), second: viewPortFactory(() => (false))} });

      step.run(instruction, state.next);
      expect(state.rejection).toBeTruthy();
    });

    it('should pass a navigationInstruction to the callback function', () => {
      const instruction = instructionFactory({ plan: { first: viewPortFactory(() => (true)) } });
      const viewModel = instruction.plan.first.prevComponent.viewModel;
      spyOn(viewModel, 'canDeactivate').and.callThrough();
      step.run(instruction, state.next);
      expect(viewModel.canDeactivate).toHaveBeenCalledWith(instruction);
    });

    describe('with a childNavigationInstruction', () => {
        let viewPort = viewPortFactory(() => (true));
        let instruction = instructionFactory({ plan: { first: viewPort } });

      describe('when navigating on the parent', () => {

        const viewPortInstructionFactory = (resultHandler) => {
          return {
            component: { viewModel: { canDeactivate: resultHandler } }
          }
        };

        it('should return true when the currentInstruction can deactivate', () => {
          let viewPort = viewPortFactory(() => (true), activationStrategy.replace);
          let currentInstruction = instructionFactory({ viewPortInstructions: { first: viewPortInstructionFactory(() => (true)) } });
          viewPort.prevComponent.childRouter = { currentInstruction };
          let instruction = instructionFactory({ plan: { first: viewPort } });
          step.run(instruction, state.next);
          expect(state.result).toBe(true);
        });

        it('should cancel when router instruction cannot deactivate', () => {
          let viewPort = viewPortFactory(() => (true), activationStrategy.replace);
          let currentInstruction = instructionFactory({ viewPortInstructions: { first: viewPortInstructionFactory(() => (false)) } });
          viewPort.prevComponent.childRouter = { currentInstruction };
          let instruction = instructionFactory({ plan: { first: viewPort } });
          step.run(instruction, state.next);
          expect(state.rejection).toBeTruthy();
        });

      });
    });
  });

  describe('CanActivateNextStep', () => {
    let step;
    let state;

    function getNavigationInstruction(resultHandler, strategy = activationStrategy.invokeLifecycle) {
      return {
        plan: {
          default: {
            strategy: strategy
          }
        },
        viewPortInstructions: {
          default: {
            component: { viewModel: { canActivate: resultHandler } }
          }
        }
      };
    }

    beforeEach(() => {
      step = new CanActivateNextStep();
      state = createPipelineState();
    });

    it('should return true for context that canActivate', () => {
      let instruction = getNavigationInstruction(() => (true));

      step.run(instruction, state.next);
      expect(state.result).toBe(true);
    });

    it('should return true for context that canActivate with activationStrategy.replace', () => {
      let instruction = getNavigationInstruction(() => (true), activationStrategy.replace);

      step.run(instruction, state.next);
      expect(state.result).toBe(true);
    });

    it('should cancel for context that cannot activate', () => {
      let instruction = getNavigationInstruction(() => (false));

      step.run(instruction, state.next);
      expect(state.rejection).toBeTruthy();
    });
  });

  describe('ActivateNextStep', () => {
    let step;
    let state;

    beforeEach(() => {
      step = new ActivateNextStep();
      state = createPipelineState();
    });

    it('should pass current viewport name to activate', (done) => {
      const instruction = new NavigationInstruction({
        plan: {
          "my-view-port": { strategy: activationStrategy.invokeLifecycle }
        }
      });

      const viewModel = {
        activate(params, config, instruction) {
          expect(config.currentViewPort).toBe('my-view-port');
          done();
        }
      }

      instruction.addViewPortInstruction('my-view-port', 'ignored', 'ignored', { viewModel });
      step.run(instruction, state.next);
    });
  });
});
