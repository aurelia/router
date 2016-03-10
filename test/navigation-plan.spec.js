import {BuildNavigationPlanStep} from '../src/navigation-plan';
import {NavigationInstruction} from '../src/navigation-instruction';
import {Redirect} from '../src/navigation-commands';
import {createPipelineState} from './test-util';

describe('NavigationPlanStep', () => {
  let step;
  let state;
  let redirectInstruction;
  let firstInstruction;
  let sameAsFirstInstruction;
  let secondInstruction;

  beforeEach(() => {
    step = new BuildNavigationPlanStep();
    state = createPipelineState();

    redirectInstruction = new NavigationInstruction({
      fragment: 'first',
      queryString: 'q=1',
      config: { redirect: 'second' }
    });

    firstInstruction = new NavigationInstruction({
      fragment: 'first',
      config: { viewPorts: { default: { moduleId: './first' }}},
      params: { id: '1' }
    });

    sameAsFirstInstruction = new NavigationInstruction({
      fragment: 'first',
      config: { viewPorts: { default: { moduleId: './first' }}},
      previousInstruction: firstInstruction,
      params: { id: '1' }
    });

    secondInstruction = new NavigationInstruction({
      fragment: 'second',
      config: { viewPorts: { default: { moduleId: './second' }}},
      previousInstruction: firstInstruction
    });
  });

  it('cancels on redirect configs', (done) => {
    step.run(redirectInstruction, state.next)
      .then(e => {
        expect(state.rejection).toBeTruthy();
        expect(e instanceof Redirect).toBe(true);
        expect(e.url).toBe('#/second?q=1');
        done();
      });
  });

  describe('generates navigation plans', () => {
    it('with no prev step', (done) => {
      step.run(firstInstruction, state.next)
      .then(() => {
        expect(state.result).toBe(true);
        expect(firstInstruction.plan).toBeTruthy();
        done();
      });
    });

    it('with prev step', (done) => {
      step.run(secondInstruction, state.next)
      .then(() => {
        expect(state.result).toBe(true);
        expect(secondInstruction.plan).toBeTruthy();
        done();
      });
    });

    it('with prev step with viewport', (done) => {
      firstInstruction.addViewPortInstruction('default', 'no-change', './first', {});

      step.run(secondInstruction, state.next)
      .then(() => {
        expect(state.result).toBe(true);
        expect(secondInstruction.plan).toBeTruthy();
        done();
      });
    });
  });

  describe('activation strategy', () => {
    it('is replace when moduleId changes', (done) => {
      firstInstruction.addViewPortInstruction('default', 'no-change', './first', {});

      step.run(secondInstruction, state.next)
      .then(() => {
        expect(state.result).toBe(true);
        expect(secondInstruction.plan.default.strategy).toBe('replace');
        done();
      });
    });

    it('is no-change when nothing changes', (done) => {
      firstInstruction.addViewPortInstruction('default', 'ignored', './first', { viewModel: {}});

      step.run(sameAsFirstInstruction, state.next)
      .then(() => {
        expect(state.result).toBe(true);
        expect(sameAsFirstInstruction.plan.default.strategy).toBe('no-change');
        done();
      });
    });

    it('can be determined by route config', (done) => {
      sameAsFirstInstruction.config.activationStrategy = 'fake-strategy';
      firstInstruction.addViewPortInstruction('default', 'ignored', './first', { viewModel: {}});

      step.run(sameAsFirstInstruction, state.next)
      .then(() => {
        expect(state.result).toBe(true);
        expect(sameAsFirstInstruction.plan.default.strategy).toBe('fake-strategy');
        done();
      });
    });

    it('can be determined by view model', (done) => {
      let viewModel = { determineActivationStrategy: () => 'vm-strategy'};
      firstInstruction.addViewPortInstruction('default', 'ignored', './first', { viewModel });

      step.run(sameAsFirstInstruction, state.next)
      .then(() => {
        expect(state.result).toBe(true);
        expect(sameAsFirstInstruction.plan.default.strategy).toBe('vm-strategy');
        done();
      });
    });

    it('is invoke-lifecycle when only params change', (done) => {
      firstInstruction.params = { id: '1' };
      sameAsFirstInstruction.params = { id: '2' };
      firstInstruction.addViewPortInstruction('default', 'ignored', './first', { viewModel: {}});

      step.run(sameAsFirstInstruction, state.next)
      .then(() => {
        expect(state.result).toBe(true);
        expect(sameAsFirstInstruction.plan.default.strategy).toBe('invoke-lifecycle');
        done();
      });
    });

    it('is invoke-lifecycle when query params change and ignoreQueryParams is false', (done) => {
      firstInstruction.queryParams = { param: 'foo' };
      sameAsFirstInstruction.queryParams = { param: 'bar' };
      sameAsFirstInstruction.options.compareQueryParams = true;
      firstInstruction.addViewPortInstruction('default', 'ignored', './first', { viewModel: {}});

      step.run(sameAsFirstInstruction, state.next)
      .then(() => {
        expect(state.result).toBe(true);
        expect(sameAsFirstInstruction.plan.default.strategy).toBe('invoke-lifecycle');
        done();
      });
    });
  });
});
