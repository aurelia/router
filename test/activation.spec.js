import {
	CanDeactivatePreviousStep,
	CanActivateNextStep,
	DeactivatePreviousStep,
	ActivateNextStep
} from '../src/activation';
import {activationStrategy} from '../src/navigation-plan';

describe('activation', () => {
	var viewPortFactory = (resultHandler, strategy = activationStrategy.invokeLifecycle) => {
		return {
			strategy: strategy,
			prevComponent: { bindingContext: { canDeactivate: resultHandler } }
		};
	};

	describe('CanDeactivatePreviousStep', () => {
		var sut,
			nextResult = null,
			next = () => {
				nextResult = true;
				return Promise.resolve(nextResult);
			};

		next.cancel = () => {
			nextResult = 'cancel';
			return Promise.resolve(nextResult);
		};

		beforeEach(() => {
			sut = new CanDeactivatePreviousStep();
			nextResult = null;
		});

		it('should return true for context that canDeactivate', () => {
			var singleNavContext = { plan: { first: viewPortFactory(() => (true)) } };

			sut.run(singleNavContext, next)
			expect(nextResult).toBe(true);
		});

		it('should return true for context that canDeactivate with activationStrategy.replace', () => {
			var singleNavContext = { plan: { first: viewPortFactory(() => (true), activationStrategy.replace) } };

			sut.run(singleNavContext, next)
			expect(nextResult).toBe(true);
		});

		it('should cancel for context that cannot Deactivate', () => {
			var singleNavContext = { plan: {first: viewPortFactory(() => (false)) } };

			sut.run(singleNavContext, next)
			expect(nextResult).toBe('cancel');
		});

		it('should return true for context that cannot Deactivate with unknown strategy', () => {
			var singleNavContext = { plan: {first: viewPortFactory(() => (false), 'unknown') } };

			sut.run(singleNavContext, next)
			expect(nextResult).toBe(true);
		});


		it('should return true for context that canDeactivate with a promise', (done) => {
			var singleNavPromiseContext = { plan: {first: viewPortFactory(() => (Promise.resolve(true))) } };

			sut.run(singleNavPromiseContext, next).then(() => {
				expect(nextResult).toBe(true);
				done();
			});
		});

		it('should cancel for context that cantDeactivate with a promise', (done) => {
			var singleNavPromiseContext = { plan: {first: viewPortFactory(() => (Promise.resolve(false))) } };

			sut.run(singleNavPromiseContext, next).then(() => {
				expect(nextResult).toBe('cancel');
				done();
			});
		});

		it('should return true when all plans return true', () => {
			var doubleNavContext = { plan: { first: viewPortFactory(() => (true)), second: viewPortFactory(() => (true))} };

			sut.run(doubleNavContext, next)
			expect(nextResult).toBe(true);
		});

		it('should cancel when some plans return false', () => {
			var doubleNavContext = { plan: {first: viewPortFactory(() => (true)), second: viewPortFactory(() => (false))} };

			sut.run(doubleNavContext, next)
			expect(nextResult).toBe('cancel');
		});

		describe('with a childNavigationContext', () => {
			it ('should return true when child is true', () => {
				var viewPort = viewPortFactory(() => (true)),
					navContextWithChild = { plan: { first: viewPort } };

				viewPort.childNavigationContext = { plan: { first:viewPortFactory(() => (true)) } };

				sut.run(navContextWithChild, next)
				expect(nextResult).toBe(true);
			});

			it ('should cancel when child is false', () => {
				var viewPort = viewPortFactory(() => (true)),
					navContextWithChild = { plan: { first: viewPort } };

				viewPort.childNavigationContext = { plan: { first:viewPortFactory(() => (false)) } };

				sut.run(navContextWithChild, next);
				expect(nextResult).toBe('cancel');
			});
		});

		describe('with router and currentInstruction', ()=> {
			var bindingContext = { },
				viewPort = viewPortFactory(() => (true)),
				navContextWithRouter = { plan: { first: viewPort } };

			viewPort.prevComponent.childRouter = { currentInstruction: { viewPortInstructions: { first: { component: { bindingContext: bindingContext }}}} };

			it('should return true when router instruction canDeactivate', () => {
				bindingContext.canDeactivate = () => (true);

				sut.run(navContextWithRouter, next)
				expect(nextResult).toBe(true);
			});

			it('should cancel when router instruction cannot deactivate', () => {
				bindingContext.canDeactivate = () => (false);

				navContextWithRouter.plan = { first: viewPort };

				sut.run(navContextWithRouter, next)
				expect(nextResult).toBe('cancel');
			});
		});
	});
});
