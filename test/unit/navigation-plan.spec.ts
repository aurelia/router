import { Container } from 'aurelia-dependency-injection';
import {
  AppRouter,
  Router,
  PipelineProvider,
  Redirect,
  NavigationInstruction,
  NavigationInstructionInit,
  BuildNavigationPlanStep,
  RouteConfig,
  ViewPortComponent
} from '../../src';
import { MockHistory, createPipelineState, MockPipelineState } from '../shared';

describe('NavigationPlanStep', function NavigationPlanStep_Tests() {
  let step: BuildNavigationPlanStep;
  let state: MockPipelineState;
  let redirectInstruction: NavigationInstruction;
  let firstInstruction: NavigationInstruction;
  let sameAsFirstInstruction: NavigationInstruction;
  let secondInstruction: NavigationInstruction;
  let router: Router;
  let child: Router;
  let grandchild: Router;

  beforeEach(function __setup__() {
    step = new BuildNavigationPlanStep();
    state = createPipelineState();
    router = new AppRouter(
      new Container(),
      new MockHistory(),
      new PipelineProvider(new Container()),
      null
    );
    router.useViewPortDefaults({ default: { moduleId: null } });
    child = router.createChild(new Container());
    grandchild = child.createChild(new Container());

    redirectInstruction = new NavigationInstruction({
      fragment: 'first',
      queryString: 'q=1',
      config: { redirect: 'second' },
      router
    } as NavigationInstructionInit);

    firstInstruction = new NavigationInstruction({
      fragment: 'first',
      config: { viewPorts: { default: { moduleId: './first' } } } as RouteConfig,
      params: { id: '1' },
      router
    } as NavigationInstructionInit);

    sameAsFirstInstruction = new NavigationInstruction({
      fragment: 'first',
      config: { viewPorts: { default: { moduleId: './first' } } } as RouteConfig,
      previousInstruction: firstInstruction,
      params: { id: '1' },
      router
    } as NavigationInstructionInit);

    secondInstruction = new NavigationInstruction({
      fragment: 'second',
      config: { viewPorts: { default: { moduleId: './second' } } } as RouteConfig,
      previousInstruction: firstInstruction,
      router
    } as NavigationInstructionInit);
  });

  it('cancels on redirect configs', async () => {
    redirectInstruction.router.addRoute({ route: 'first', name: 'first', redirect: 'second' });
    redirectInstruction.router.addRoute({ route: 'second', name: 'second', redirect: 'second' });
    const e = await step.run(redirectInstruction, state.next);
    // .then(e => {
    expect(state.rejection).toBeTruthy();
    console.log(e);
    expect(e instanceof Redirect).toBe(true);
    expect(e.url).toBe('#/second?q=1');
    // done();
    // })
    // .catch(done.fail);
  });

  it('redirects to routes without names', (done) => {
    const url = 'first/10?q=1';
    const from = { route: 'first', redirect: 'second' };
    const to = { route: 'second', moduleId: './second' };
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
        })
        .catch(done.fail);
    });
  });

  it('redirects to routes with dynamic parameters', (done) => {
    const url = 'first/10?q=1';
    const from = { name: 'first', route: 'first/:this', redirect: 'second/:this' };
    const to = { name: 'second', route: 'second/:that', moduleId: './second' };

    router.addRoute(from);
    router.addRoute(to);
    router._createNavigationInstruction(url).then((instruction) => {
      return step.run(instruction, state.next)
        .then(e => {
          expect(state.rejection).toBeTruthy();
          expect(e instanceof Redirect).toBe(true);
          expect(e.url).toBe(`#/second/10?q=1`);
          done();
        });
    })
      .catch(done.fail);
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
        })
        .catch(done.fail);
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
        })
        .catch(done.fail);
    });
  });

  it('redirects unknown routes to statically configured routes', async (done) => {
    const url = 'nowhere';
    const from = { route: 'first', moduleId: './first' };
    const to = { route: 'second', moduleId: './second' };

    await router.configure((config) => config.map([from, to]).mapUnknownRoutes({ redirect: 'second' }));
    router.navigate('first');
    const instruction = await router._createNavigationInstruction(url);
    const result = await step.run(instruction, state.next);
    expect(state.rejection).toBeTruthy();
    expect(result instanceof Redirect).toBe(true);
    expect(result.url).toBe(`#/second`);
    done();
  });

  it('redirects unknown routes to dynamically configured routes', async (done) => {
    const url = 'nowhere';
    const from = { route: 'first', moduleId: './first' };
    const to = { route: 'second', moduleId: './second' };

    await router.configure((config) => config.map([from, to]).mapUnknownRoutes(() => { return { redirect: 'second' }; }));
    router.navigate('first');
    const instruction = await router._createNavigationInstruction(url);
    const result = await step.run(instruction, state.next);
    expect(state.rejection).toBeTruthy();
    expect(result instanceof Redirect).toBe(true);
    expect(result.url).toBe(`#/second`);
    done();
  });

  it('redirects unknown routes to statically configured child routes', async (done) => {
    const url = 'nowhere';
    const base = { route: 'home', moduleId: './home' };
    const from = { route: 'first', moduleId: './first' };
    const to = { route: 'second', moduleId: './second' };

    await router.configure((config) => config.map([base]).mapUnknownRoutes({ redirect: 'home/second' }));
    child.configure(config => config.map([from, to]));
    router.navigate('first');
    const parentInstruction = await router._createNavigationInstruction(url);
    const childInstruction = await child._createNavigationInstruction(parentInstruction.getWildcardPath(), parentInstruction);
    const result = await step.run(childInstruction, state.next);
    expect(state.rejection).toBeTruthy();
    expect(result instanceof Redirect).toBe(true);
    expect(result.url).toBe(`#/home/second`);
    done();
  });

  it('redirects unknown routes to dynamically configured child routes', async (done) => {
    const url = 'nowhere';
    const base = { route: 'home', moduleId: './home' };
    const from = { route: 'first', moduleId: './first' };
    const to = { route: 'second', moduleId: './second' };

    await router.configure((config) => config.map([base]).mapUnknownRoutes(() => { return { redirect: 'home/second' }; }));
    child.configure(config => config.map([from, to]));
    router.navigate('first');
    const parentInstruction = await router._createNavigationInstruction(url);
    const childInstruction = await child._createNavigationInstruction(parentInstruction.getWildcardPath(), parentInstruction);
    const result = await step.run(childInstruction, state.next);
    expect(state.rejection).toBeTruthy();
    expect(result instanceof Redirect).toBe(true);
    expect(result.url).toBe(`#/home/second`);
    done();
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
          })
          .catch(done.fail);
      });
    });
  });

  it('redirects from parents to children', (done) => {
    const url = 'home/shortcut';
    const one = { name: 'first', route: 'home', moduleId: './one' };
    const two = { name: 'second', route: 'two', moduleId: './two' };
    const three = { name: 'third', route: 'three', moduleId: './three' };
    const to = { name: 'shortcut', route: 'shortcut', redirect: 'two/three' };

    router.addRoute(one);
    child.addRoute(two);
    child.addRoute(to);
    grandchild.addRoute(three);
    router.navigate('home');
    router._createNavigationInstruction(url).then((parentInstruction) => {
      child._createNavigationInstruction(parentInstruction.getWildcardPath(), parentInstruction).then(childInstruction => {
        step.run(childInstruction, state.next)
          .then(e => {
            expect(state.rejection).toBeTruthy();
            expect(e instanceof Redirect).toBe(true);
            expect(e.url).toBe('#/home/two/three');
            done();
          });
      });
    });
  });

  it('redirects from parents to grandchildren', (done) => {
    const url = 'shortcut';
    const one = { name: 'first', route: ['home', 'one'], moduleId: './one' };
    const two = { name: 'second', route: 'two', moduleId: './two' };
    const three = { name: 'third', route: 'three', moduleId: './three' };
    const to = { name: 'shortcut', route: 'shortcut', redirect: 'one/two/three' };

    router.addRoute(one);
    router.addRoute(to);
    child.addRoute(two);
    grandchild.addRoute(three);
    router.navigate('one');
    router._createNavigationInstruction(url).then((instruction) => {
      step.run(instruction, state.next)
        .then(e => {
          expect(state.rejection).toBeTruthy();
          expect(e instanceof Redirect).toBe(true);
          expect(e.url).toBe('#/one/two/three');
          done();
        });
    });
  });

  it('redirects from parents to grandchildren with static params', (done) => {
    const url = 'shortcut';
    const one = { name: 'first', route: ['home', 'one'], moduleId: './one' };
    const two = { name: 'second/:id', route: 'two', moduleId: './two' };
    const three = { name: 'third/:id', route: 'three', moduleId: './three' };
    const to = { name: 'shortcut', route: 'shortcut', redirect: 'one/two/2/three/3' };

    router.addRoute(one);
    router.addRoute(to);
    child.addRoute(two);
    grandchild.addRoute(three);
    router.navigate('one');
    router._createNavigationInstruction(url).then((instruction) => {
      step.run(instruction, state.next)
        .then(e => {
          expect(state.rejection).toBeTruthy();
          expect(e instanceof Redirect).toBe(true);
          expect(e.url).toBe('#/one/two/2/three/3');
          done();
        });
    });
  });

  it('redirects from parents to grandchildren with dynamic params', (done) => {
    const url = 'shortcut/1/2';
    const one = { name: 'first', route: ['home', 'one'], moduleId: './one' };
    const two = { name: 'second/:id', route: 'two', moduleId: './two' };
    const three = { name: 'third/:id', route: 'three', moduleId: './three' };
    const to = { name: 'shortcut', route: 'shortcut/:second/:third', redirect: 'one/two/:second/three/:third' };

    router.addRoute(one);
    router.addRoute(to);
    child.addRoute(two);
    grandchild.addRoute(three);
    router.navigate('one');
    router._createNavigationInstruction(url).then((instruction) => {
      step.run(instruction, state.next)
        .then(e => {
          expect(state.rejection).toBeTruthy();
          expect(e instanceof Redirect).toBe(true);
          expect(e.url).toBe('#/one/two/1/three/2');
          done();
        });
    });
  });

  it('redirects children with static parameters', (done) => {
    const url = 'home/first/0';
    const base = { name: 'home', route: 'home', moduleId: './home' };
    const from = { name: 'first', route: 'first/:id', redirect: 'second/1' };
    const to = { name: 'second', route: 'second/:id', moduleId: './second' };

    router.addRoute(base);
    child.configure(config => config.map([from, to]));
    router.navigate('home');
    router._createNavigationInstruction(url).then((parentInstruction) => {
      child._createNavigationInstruction(parentInstruction.getWildcardPath(), parentInstruction).then(childInstruction => {
        step.run(childInstruction, state.next)
          .then(e => {
            expect(state.rejection).toBeTruthy();
            expect(e instanceof Redirect).toBe(true);
            expect(e.url).toBe(`#/home/second/1`);
            done();
          });
      });
    });
  });

  it('redirects children with dynamic parameters', (done) => {
    const url = 'home/first/1';
    const base = { name: 'home', route: 'home', moduleId: './home' };
    const from = { name: 'first', route: 'first/:id', redirect: 'second/:id' };
    const to = { name: 'second', route: 'second/:id', moduleId: './second' };

    router.addRoute(base);
    child.configure(config => config.map([from, to]));
    router.navigate('home');
    router._createNavigationInstruction(url).then((parentInstruction) => {
      child._createNavigationInstruction(parentInstruction.getWildcardPath(), parentInstruction).then(childInstruction => {
        step.run(childInstruction, state.next)
          .then(e => {
            expect(state.rejection).toBeTruthy();
            expect(e instanceof Redirect).toBe(true);
            expect(e.url).toBe(`#/home/second/1`);
            done();
          });
      });
    });
  });
  it('redirects from parents to children', (done) => {
    const url = 'shortcut';
    const one = { name: 'first', route: ['home', 'one'], moduleId: './one' };
    const two = { name: 'second', route: 'two', moduleId: './two' };
    const three = { name: 'third', route: 'three', moduleId: './three' };
    const to = { name: 'shortcut', route: 'shortcut', redirect: 'one/two/three' };
    router.addRoute(one);
    router.addRoute(to);
    child.addRoute(two);
    grandchild.addRoute(three);
    router.navigate('one');
    router._createNavigationInstruction(url).then((instruction) => {
      step.run(instruction, state.next)
        .then(e => {
          expect(state.rejection).toBeTruthy();
          expect(e instanceof Redirect).toBe(true);
          expect(e.url).toBe('#/one/two/three');
          done();
        });
    });
  });
  it('redirects children with static parameters', (done) => {
    const url = 'home/first/0';
    const base = { name: 'home', route: 'home', moduleId: './home' };
    const from = { name: 'first', route: 'first/:id', redirect: 'second/1' };
    const to = { name: 'second', route: 'second/:id', moduleId: './second' };
    router.addRoute(base);
    child.configure(config => config.map([from, to]));
    router.navigate('home');
    router._createNavigationInstruction(url).then((parentInstruction) => {
      child._createNavigationInstruction(parentInstruction.getWildcardPath(), parentInstruction).then(childInstruction => {
        step.run(childInstruction, state.next)
          .then(e => {
            expect(state.rejection).toBeTruthy();
            expect(e instanceof Redirect).toBe(true);
            expect(e.url).toBe(`#/home/second/1`);
            done();
          });
      });
    });
  });

  it('redirects children with dynamic parameters', (done) => {
    const url = 'home/first/1';
    const base = { name: 'home', route: 'home', moduleId: './home' };
    const from = { name: 'first', route: 'first/:id', redirect: 'second/:id' };
    const to = { name: 'second', route: 'second/:id', moduleId: './second' };
    router.addRoute(base);
    child.configure(config => config.map([from, to]));
    router.navigate('home');
    router._createNavigationInstruction(url).then((parentInstruction) => {
      child._createNavigationInstruction(parentInstruction.getWildcardPath(), parentInstruction).then(childInstruction => {
        step.run(childInstruction, state.next)
          .then(e => {
            expect(state.rejection).toBeTruthy();
            expect(e instanceof Redirect).toBe(true);
            expect(e.url).toBe(`#/home/second/1`);
            done();
          });
      });
    });
  });

  describe('generates navigation plans', function NavigationPlan_Generation_Tests() {
    it('with no prev step', (done) => {
      step.run(firstInstruction, state.next)
        .then(() => {
          expect(state.result).toBe(true);
          expect(firstInstruction.plan).toBeTruthy();
          done();
        })
        .catch(done.fail);
    });

    it('with prev step', (done) => {
      step.run(secondInstruction, state.next)
        .then(() => {
          expect(state.result).toBe(true);
          expect(secondInstruction.plan).toBeTruthy();
          done();
        })
        .catch(done.fail);
    });

    it('with prev step with viewport', (done) => {
      firstInstruction.addViewPortInstruction('default', 'no-change', './first', {} as ViewPortComponent);

      step.run(secondInstruction, state.next)
        .then(() => {
          expect(state.result).toBe(true);
          expect(secondInstruction.plan).toBeTruthy();
          done();
        })
        .catch(done.fail);
    });
  });

  describe('activation strategy', function ActivationStrategy_Tests() {
    it('is replace when moduleId changes', (done) => {
      firstInstruction.addViewPortInstruction('default', 'no-change', './first', {} as ViewPortComponent);

      step.run(secondInstruction, state.next)
        .then(() => {
          expect(state.result).toBe(true);
          expect(secondInstruction.plan.default.strategy).toBe('replace');
          done();
        })
        .catch(done.fail);
    });

    it('is no-change when nothing changes', (done) => {
      firstInstruction.addViewPortInstruction('default', 'ignored' as any, './first', { viewModel: {} } as ViewPortComponent);

      step.run(sameAsFirstInstruction, state.next)
        .then(() => {
          expect(state.result).toBe(true);
          expect(sameAsFirstInstruction.plan.default.strategy).toBe('no-change');
          done();
        })
        .catch(done.fail);
    });

    it('can be determined by route config', (done) => {
      sameAsFirstInstruction.config.activationStrategy = 'fake-strategy' as any;
      firstInstruction.addViewPortInstruction('default', 'ignored' as any, './first', { viewModel: {} } as ViewPortComponent);

      step.run(sameAsFirstInstruction, state.next)
        .then(() => {
          expect(state.result).toBe(true);
          expect(sameAsFirstInstruction.plan.default.strategy).toBe('fake-strategy');
          done();
        })
        .catch(done.fail);
    });

    it('can be determined by view model', (done) => {
      let viewModel = { determineActivationStrategy: () => 'vm-strategy' };
      firstInstruction.addViewPortInstruction('default', 'ignored' as any, './first', { viewModel } as ViewPortComponent);

      step.run(sameAsFirstInstruction, state.next)
        .then(() => {
          expect(state.result).toBe(true);
          expect(sameAsFirstInstruction.plan.default.strategy).toBe('vm-strategy');
          done();
        })
        .catch(done.fail);
    });

    it('is invoke-lifecycle when only params change', (done) => {
      firstInstruction.params = { id: '1' };
      sameAsFirstInstruction.params = { id: '2' };
      firstInstruction.addViewPortInstruction('default', 'ignored' as any, './first', { viewModel: {} } as ViewPortComponent);

      step.run(sameAsFirstInstruction, state.next)
        .then(() => {
          expect(state.result).toBe(true);
          expect(sameAsFirstInstruction.plan.default.strategy).toBe('invoke-lifecycle');
          done();
        })
        .catch(done.fail);
    });

    it('is invoke-lifecycle when query params change and ignoreQueryParams is false', (done) => {
      firstInstruction.queryParams = { param: 'foo' };
      sameAsFirstInstruction.queryParams = { param: 'bar' };
      sameAsFirstInstruction.options.compareQueryParams = true;
      firstInstruction.addViewPortInstruction('default', 'ignored' as any, './first', { viewModel: {} } as ViewPortComponent);

      step.run(sameAsFirstInstruction, state.next)
        .then(() => {
          expect(state.result).toBe(true);
          expect(sameAsFirstInstruction.plan.default.strategy).toBe('invoke-lifecycle');
          done();
        })
        .catch(done.fail);
    });
  });
});
