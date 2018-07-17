import {BuildNavigationPlanStep} from '../src/navigation-plan';
import {NavigationInstruction} from '../src/navigation-instruction';
import {Redirect} from '../src/navigation-commands';
import {createPipelineState} from './test-util';
import {AppRouter} from '../src/app-router';
import {MockHistory} from './router.spec.js';
import {Container} from 'aurelia-dependency-injection';
import {PipelineProvider} from '../src/pipeline-provider';

describe('NavigationPlanStep', () => {
  let step;
  let state;
  let redirectInstruction;
  let firstInstruction;
  let sameAsFirstInstruction;
  let secondInstruction;
  let router;
  let child;

  beforeEach(() => {
    step = new BuildNavigationPlanStep();
    state = createPipelineState();
    router = new AppRouter(new Container(), new MockHistory(), new PipelineProvider(new Container()));
    router.useViewPortDefaults({ default: { moduleId: null } });
    child = router.createChild(new Container());

    redirectInstruction = new NavigationInstruction({
      fragment: 'first',
      queryString: 'q=1',
      config: { redirect: 'second' },
      router
    });

    firstInstruction = new NavigationInstruction({
      fragment: 'first',
      config: { viewPorts: { default: { moduleId: './first' }}},
      params: { id: '1' },
      router
    });

    sameAsFirstInstruction = new NavigationInstruction({
      fragment: 'first',
      config: { viewPorts: { default: { moduleId: './first' }}},
      previousInstruction: firstInstruction,
      params: { id: '1' },
      router
    });

    secondInstruction = new NavigationInstruction({
      fragment: 'second',
      config: { viewPorts: { default: { moduleId: './second' }}},
      previousInstruction: firstInstruction,
      router
    });
  });

  it('cancels on redirect configs', (done) => {
    redirectInstruction.router.addRoute({route: 'first', name: 'first',  redirect: 'second' });
    redirectInstruction.router.addRoute({route: 'second', name: 'second',  redirect: 'second' });
    step.run(redirectInstruction, state.next)
      .then(e => {
        expect(state.rejection).toBeTruthy();
        expect(e instanceof Redirect).toBe(true);
        expect(e.url).toBe('#/second?q=1');
        done();
      });
  });

  it('redirects to routes with static parameters', (done) => {
    const url = 'first/10?q=1';
    const from = { name: 'first', route: 'first/:id', redirect: 'second/0' };
    const to = { name: 'second', route: 'second/:id', moduleId: './second' };

    router.addRoute(from);
    router.addRoute(to);
    router._createNavigationInstruction(url).then((instruction) => {
      step.run(instruction, state.next)
        .then(e => {
          expect(state.rejection).toBeTruthy();
          expect(e instanceof Redirect).toBe(true);
          expect(e.url).toBe(`#/second/0?q=1`);
          done();
        });
    });
  });

  it('redirects to routes with dynamic parameters', (done) => {
    const url = 'first/10?q=1';
    const from = { name: 'first', route: 'first/:this', redirect: 'second/:this' };
    const to = { name: 'second', route: 'second/:that', moduleId: './second' };

    router.addRoute(from);
    router.addRoute(to);
    router._createNavigationInstruction(url).then((instruction) => {
      step.run(instruction, state.next)
        .then(e => {
          expect(state.rejection).toBeTruthy();
          expect(e instanceof Redirect).toBe(true);
          expect(e.url).toBe(`#/second/10?q=1`);
          done();
        });
    });
  });

  it('redirects and drops unused dynamic parameters', (done) => {
    const url = 'first/10/20?q=1';
    const from = { name: 'first', route: 'first/:this/:that', redirect: 'second/:that' };
    const to = { name: 'second', route: 'second/:id', moduleId: './second' };

    router.addRoute(from);
    router.addRoute(to);
    router._createNavigationInstruction(url).then((instruction) => {
      step.run(instruction, state.next)
        .then(e => {
          expect(state.rejection).toBeTruthy();
          expect(e instanceof Redirect).toBe(true);
          expect(e.url).toBe(`#/second/20?q=1`);
          done();
        });
    });
  });

  it('redirects and ignores invalid dynamic parameters', (done) => {
    const url = 'first/20?q=1';
    const from = { name: 'first', route: 'first/:this', redirect: 'second/:that' };
    const to = { name: 'second', route: 'second/:that?', moduleId: './second' };

    router.addRoute(from);
    router.addRoute(to);
    router._createNavigationInstruction(url).then((instruction) => {
      step.run(instruction, state.next)
        .then(e => {
          expect(state.rejection).toBeTruthy();
          expect(e instanceof Redirect).toBe(true);
          expect(e.url).toBe(`#/second?q=1`);
          done();
        });
    });
  });

  it('redirects children', (done) => {
    const url = 'home/first';
    const base = { name: 'home', route: 'home', moduleId: './home' };
    const from = { name: 'first', route: 'first', redirect: 'second' };
    const to = { name: 'second', route: 'second', moduleId: './second' };

    router.addRoute(base);
    child.configure(config => config.map([from, to]));
    router.navigate('home');
    router._createNavigationInstruction(url).then((parentInstruction) => {
      child._createNavigationInstruction(parentInstruction.getWildcardPath(), parentInstruction).then(childInstruction => {
        step.run(childInstruction, state.next)
          .then(e => {
            expect(state.rejection).toBeTruthy();
            expect(e instanceof Redirect).toBe(true);
            expect(e.url).toBe(`#/home/second`);
            done();
          });
      });
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
