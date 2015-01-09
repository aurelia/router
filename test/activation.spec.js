import {
	CanDeactivatePreviousStep,
	CanActivateNextStep,
	DeactivatePreviousStep,
	ActivateNextStep
} from '../src/activation';
import {
	INVOKE_LIFECYCLE,
	REPLACE
} from '../src/navigation-plan';

describe('activation', () => {
	describe('CanDeactivatePreviousStep', () => {
		var sut,
			nextResult = null,
			returnFalse = () => (false),
			returnTrue = () => (true);

		var next = () => {
			nextResult = true;
			return Promise.resolve(nextResult);
		}
		next.cancel = () => {
			nextResult = 'cancel';
			return Promise.resolve(nextResult);
		}

		beforeEach(() => {
			sut = new CanDeactivatePreviousStep();
			nextResult = null;
		});

		it('should return true for context that canDeactivate', () => {
			var canDeactivateContext = { canDeactivate: returnTrue },			
				canDeactivateComponent = { executionContext: canDeactivateContext },
				canDeactivateViewPort = { strategy: INVOKE_LIFECYCLE, prevComponent: canDeactivateComponent },
				singleNavContext = { plan: {first: canDeactivateViewPort} };
			sut.run(singleNavContext, next)
			expect(nextResult).toBe(true);
		});

		it('should return false for context that cannot Deactivate', () => {
			var cantDeactivateContext = { canDeactivate: returnFalse },			
				cantDeactivateComponent = { executionContext: cantDeactivateContext },
				cantDeactivateViewPort = { strategy: INVOKE_LIFECYCLE, prevComponent: cantDeactivateComponent },
				singleNavContext = { plan: {first: cantDeactivateViewPort} };
			sut.run(singleNavContext, next)
			expect(nextResult).toBe('cancel');
		});

		it('should return true for context that canDeactivate with a promise', (done) => {
			var canDeactivatePromiseContext = { canDeactivate: () => (Promise.resolve(true)) },
				canDeactivatePromiseComponent = { executionContext: canDeactivatePromiseContext },
				canDeactivateViewPort = { strategy: INVOKE_LIFECYCLE, prevComponent: canDeactivatePromiseComponent },				
				singleNavPromiseContext = { plan: {first: canDeactivateViewPort} };
			sut.run(singleNavPromiseContext, next).then(() => {
				expect(nextResult).toBe(true);
				done();
			});
		});

		it('should return false for context that cantDeactivate with a promise', (done) => {
			var canDeactivatePromiseContext = { canDeactivate: () => (Promise.resolve(false)) },
				canDeactivatePromiseComponent = { executionContext: canDeactivatePromiseContext },
				canDeactivateViewPort = { strategy: INVOKE_LIFECYCLE, prevComponent: canDeactivatePromiseComponent },				
				singleNavPromiseContext = { plan: {first: canDeactivateViewPort} };
			sut.run(singleNavPromiseContext, next).then(() => {
				expect(nextResult).toBe('cancel');
				done();
			});
		});
	});
});