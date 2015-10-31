import {
  CanDeactivatePreviousStep,
  CanActivateNextStep
} from '../src/activation';
import {activationStrategy} from '../src/navigation-plan';

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

    beforeEach(() => {
      step = new CanDeactivatePreviousStep();
      state = getState();
    });

    it('should return true for context that canDeactivate', () => {
      let singleNavContext = { plan: { first: viewPortFactory(() => (true)) } };

      step.run(singleNavContext, state.next);
      expect(state.result).toBe(true);
    });

    it('should return true for context that canDeactivate with activationStrategy.replace', () => {
      let singleNavContext = { plan: { first: viewPortFactory(() => (true), activationStrategy.replace) } };

      step.run(singleNavContext, state.next);
      expect(state.result).toBe(true);
    });

    it('should cancel for context that cannot Deactivate', () => {
      let singleNavContext = { plan: { first: viewPortFactory(() => (false)) } };

      step.run(singleNavContext, state.next);
      expect(state.result).toBe('cancel');
    });

    it('should return true for context that cannot Deactivate with unknown strategy', () => {
      let singleNavContext = { plan: { first: viewPortFactory(() => (false), 'unknown') } };

      step.run(singleNavContext, state.next);
      expect(state.result).toBe(true);
    });


    it('should return true for context that canDeactivate with a promise', (done) => {
      let singleNavPromiseContext = { plan: {first: viewPortFactory(() => (Promise.resolve(true))) } };

      step.run(singleNavPromiseContext, state.next).then(() => {
        expect(state.result).toBe(true);
        done();
      });
    });

    it('should cancel for context that cantDeactivate with a promise', (done) => {
      let singleNavPromiseContext = { plan: {first: viewPortFactory(() => (Promise.resolve(false))) } };

      step.run(singleNavPromiseContext, state.next).then(() => {
        expect(state.result).toBe('cancel');
        done();
      });
    });

    it('should cancel for context that throws in canDeactivate', (done) => {
      let singleNavPromiseContext = { plan: {first: viewPortFactory(() => { throw new Error('oops') }) } };

      sut.run(singleNavPromiseContext, next).then(() => {
        expect(nextResult).toBe('cancel');
        done();
      });
    });

    it('should return true when all plans return true', () => {
      let doubleNavContext = { plan: { first: viewPortFactory(() => (true)), second: viewPortFactory(() => (true))} };

      step.run(doubleNavContext, state.next);
      expect(state.result).toBe(true);
    });

    it('should cancel when some plans return false', () => {
      let doubleNavContext = { plan: {first: viewPortFactory(() => (true)), second: viewPortFactory(() => (false))} };

      step.run(doubleNavContext, state.next);
      expect(state.result).toBe('cancel');
    });

    describe('with a childNavigationContext', () => {
      it('should return true when child is true', () => {
        let viewPort = viewPortFactory(() => (true));
        let navContextWithChild = { plan: { first: viewPort } };

        viewPort.childNavigationContext = { plan: { first: viewPortFactory(() => (true)) } };

        step.run(navContextWithChild, state.next);
        expect(state.result).toBe(true);
      });

      it('should cancel when child is false', () => {
        let viewPort = viewPortFactory(() => (true));
        let navContextWithChild = { plan: { first: viewPort } };

        viewPort.childNavigationContext = { plan: { first: viewPortFactory(() => (false)) } };

        step.run(navContextWithChild, state.next);
        expect(state.result).toBe('cancel');
      });
    });

    describe('with router and currentInstruction', ()=> {
      let viewModel = { };
      let viewPort = viewPortFactory(() => (true));
      let navContextWithRouter = { plan: { first: viewPort } };

      viewPort.prevComponent.childRouter = { currentInstruction: { viewPortInstructions: { first: { component: { viewModel: viewModel }}}} };

      it('should return true when router instruction canDeactivate', () => {
        viewModel.canDeactivate = () => (true);

        step.run(navContextWithRouter, state.next);
        expect(state.result).toBe(true);
      });

      it('should cancel when router instruction cannot deactivate', () => {
        viewModel.canDeactivate = () => (false);

        navContextWithRouter.plan = { first: viewPort };

        step.run(navContextWithRouter, state.next);
        expect(state.result).toBe('cancel');
      });
    });
  });

  describe('CanActivateNextStep', () => {
    let step;
    let state;

    function getNavigationContext(resultHandler, strategy = activationStrategy.invokeLifecycle) {
      return {
        plan: {
          default: {
            strategy: strategy
          }
        },
        nextInstruction: {
          viewPortInstructions: {
            default: {
              component: { bindingContext: { canActivate: resultHandler } }
            }
          }
        }
      };
    }

    beforeEach(() => {
      step = new CanActivateNextStep();
      state = getState();
    });

    it('should return true for context that canActivate', () => {
      let singleNavContext = getNavigationContext(() => (true));

      step.run(singleNavContext, state.next);
      expect(state.result).toBe(true);
    });

    it('should return true for context that canActivate with activationStrategy.replace', () => {
      let singleNavContext = getNavigationContext(() => (true), activationStrategy.replace);

      step.run(singleNavContext, state.next);
      expect(state.result).toBe(true);
    });

    it('should cancel for context that cannot activate', () => {
      let singleNavContext = getNavigationContext(() => (false));

      step.run(singleNavContext, state.next);
      expect(state.result).toBe('cancel');
    });
  });
});

function getState() {
  let nextResult = null;
  let next = () => {
    nextResult = true;
    return Promise.resolve(nextResult);
  };

  next.cancel = () => {
    nextResult = 'cancel';
    return Promise.resolve(nextResult);
  };

  return {
    next,
    get result() { return nextResult; }
  };
}
