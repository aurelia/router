import { History } from 'aurelia-history';
import { Container } from 'aurelia-dependency-injection';
import { MockHistory, MockRouter } from '../shared';
import {
  AppRouter,
  Router,
  ViewPortInstruction,
  RouterConfiguration,
  PipelineProvider,
  NavigationInstruction,
  ViewPortComponent
} from '../../src';
import { ActivationStrategyType } from '../../src/interfaces';

const absoluteRoot = 'http://aurelia.io/docs/';

describe('NavigationInstruction', () => {
  const activationStrategies: ActivationStrategyType[] = ['replace', 'invoke-lifecycle', 'no-change'];
  let router: Router;
  let history: History;

  beforeEach(function __setup__() {
    history = new MockHistory() as any;
    router = new AppRouter(
      new Container(),
      history,
      new PipelineProvider(new Container()),
      null
    );
  });

  describe('build title', function _1_Build_Title_Tests() {
    let child: Router;
    let config: RouterConfiguration;
    beforeEach(() => {
      router.addRoute({
        name: 'parent',
        route: 'parent',
        moduleId: 'parent',
        title: 'parent',
        nav: true
      });
      child = router.createChild(new Container());
      child.addRoute({
        name: 'child',
        route: 'child',
        moduleId: 'child',
        title: 'child',
        nav: true
      });
      config = new RouterConfiguration();
      spyOn(history, 'setTitle');
    });

    it('should generate a title from the nav model', (done) => {
      router._createNavigationInstruction('parent/child').then((instruction) => {
        child._createNavigationInstruction(instruction.getWildcardPath(), instruction).then((childInstruction) => {
          instruction.viewPortInstructions['default'] = {
            childNavigationInstruction: childInstruction
          } as ViewPortInstruction;
          instruction._updateTitle();
          expect(history.setTitle).toHaveBeenCalledWith('child | parent');
          expect(history.setTitle).not.toHaveBeenCalledWith('parent | child');
          done();
        });
      });
    });

    it('should use a router title when generating the page title', (done) => {
      config.title = 'app';
      router.configure(config);
      router._createNavigationInstruction('parent/child').then((instruction) => {
        child._createNavigationInstruction(instruction.getWildcardPath(), instruction).then((childInstruction) => {
          instruction.viewPortInstructions['default'] = {
            childNavigationInstruction: childInstruction
          } as ViewPortInstruction;
          instruction._updateTitle();
          expect(history.setTitle).toHaveBeenCalledWith('child | parent | app');
          expect(history.setTitle).not.toHaveBeenCalledWith('parent | child | app');
          done();
        });
      });
    });

    it('should use a configured title separator when generating a title', (done) => {
      config.titleSeparator = ' <3 ';
      router.configure(config);
      router._createNavigationInstruction('parent/child').then((instruction) => {
        child._createNavigationInstruction(instruction.getWildcardPath(), instruction).then((childInstruction) => {
          instruction.viewPortInstructions['default'] = {
            childNavigationInstruction: childInstruction
          } as ViewPortInstruction;
          instruction._updateTitle();
          expect(history.setTitle).toHaveBeenCalledWith('child <3 parent');
          expect(history.setTitle).not.toHaveBeenCalledWith('child </3 parent');
          done();
        });
      });
    });
  });

  describe('getBaseUrl()', function _2_GetBaseUrl_Tests() {
    let child: Router;
    const parentRouteName = 'parent';
    const parentParamRouteName = 'parent/:parent';
    const childRouteName = 'child';
    const childParamRouteName = 'child/:child';

    beforeEach(() => {
      router.addRoute({
        name: parentRouteName,
        route: '',
        moduleId: parentRouteName
      });
      router.addRoute({
        name: parentRouteName,
        route: parentRouteName,
        moduleId: parentRouteName
      });
      router.addRoute({
        name: parentParamRouteName,
        route: parentParamRouteName,
        moduleId: parentRouteName
      });
      child = router.createChild(new Container());
      child.addRoute({
        name: childRouteName,
        route: childRouteName,
        moduleId: childRouteName
      });
      child.addRoute({
        name: childParamRouteName,
        route: childParamRouteName,
        moduleId: childRouteName
      });
    });

    it('should return the raw fragment when no params exist', (done) => {
      router._createNavigationInstruction(parentRouteName).then(instruction => {
        expect(instruction.getBaseUrl()).toBe(parentRouteName);
        done();
      })
        .catch(fail);
    });

    it('should return the raw fragment when no wildcard exists', (done) => {
      router._createNavigationInstruction(parentRouteName).then(instruction => {
        instruction.params = { fake: 'fakeParams' };
        expect(instruction.getBaseUrl()).toBe(parentRouteName);
        done();
      })
        .catch(fail);
    });

    describe('when a uri contains spaces', () => {
      it('should handle an encoded uri', (done) => {
        router._createNavigationInstruction('parent/parent%201').then(instruction => {
          expect(instruction.getBaseUrl()).toBe('parent/parent%201');
          done();
        })
          .catch(fail);
      });

      it('should encode the uri', (done) => {
        router._createNavigationInstruction('parent/parent 1').then(instruction => {
          expect(instruction.getBaseUrl()).toBe('parent/parent%201');
          done();
        })
          .catch(fail);
      });

      it('should identify encoded fragments', (done) => {
        router._createNavigationInstruction('parent/parent%201/child/child%201').then(instruction => {
          expect(instruction.getBaseUrl()).toBe('parent/parent%201/');
          done();
        })
          .catch(fail);
      });

      it('should identify fragments and encode them', (done) => {
        router._createNavigationInstruction('parent/parent 1/child/child 1').then(instruction => {
          expect(instruction.getBaseUrl()).toBe('parent/parent%201/');
          done();
        })
          .catch(fail);
      });
    });

    describe('when using an empty parent route', () => {
      it('should return the non-empty matching parent route', (done) => {
        router._createNavigationInstruction('').then(parentInstruction => {
          router.currentInstruction = parentInstruction;
          child._createNavigationInstruction(childRouteName, parentInstruction).then(instruction => {
            expect(child.baseUrl).toBe(parentRouteName);
            done();
          });
        })
          .catch(fail);
      });
    });

    describe('when using an named parent route', () => {
      it('should return the non-empty matching parent route', (done) => {
        router._createNavigationInstruction(parentRouteName).then(parentInstruction => {
          router.currentInstruction = parentInstruction;
          child._createNavigationInstruction(childRouteName, parentInstruction).then(instruction => {
            expect(child.baseUrl).toBe(parentRouteName);
            done();
          });
        })
          .catch(fail);
      });
    });

    it('should update the base url when generating navigation instructions', (done) => {
      router._createNavigationInstruction(parentRouteName).then(parentInstruction => {
        router.currentInstruction = parentInstruction;
        child._createNavigationInstruction(childRouteName, parentInstruction).then(instruction => {
          expect(child.baseUrl).toBe(parentRouteName);
          done();
        });
      })
        .catch(fail);
    });
  });

  describe('addViewPortInstruction()', function _3_addViewPortInstruction_Tests() {
    let mockRouter: MockRouter;
    let navInstruction: NavigationInstruction;

    beforeEach(function __setup__() {
      mockRouter = {} as MockRouter;
      navInstruction = new NavigationInstruction({
        fragment: '',
        router: mockRouter,
        config: {}
      });
    });

    describe('with primitive params overload', function addWithPrimitiveParams_Tests() {
      it('adds', () => {
        activationStrategies.forEach(strategy => {
          const childRouter = {} as Router;
          const component = { viewModel: {}, childRouter } as ViewPortComponent;
          const viewPortInstruction = navInstruction.addViewPortInstruction('a', strategy, 'aa', component);
          expect(viewPortInstruction.childRouter).toBe(childRouter);
          expect(viewPortInstruction.component).toBe(component);
          expect(viewPortInstruction.moduleId).toBe('aa');
          expect(viewPortInstruction.name).toBe('a');
          expect(viewPortInstruction.strategy).toBe(strategy);
        });
      });

      it('throws when component is undefined / null', () => {
        activationStrategies.forEach(strategy => {
          for (const component of [undefined, null] as any[]) {
            expect(() => {
              navInstruction.addViewPortInstruction('a', strategy, 'aa', component);
            }).toThrowError(new RegExp(`Cannot read property ['"]childRouter['"] of ${component}`));
          }
        });
      });
    });

    describe('with partial viewport instruction overload', function addWithPartialInstruction_Tests() {
      it('adds using viewport instruction parameter', () => {
        for (const strategy of activationStrategies) {
          const childRouter = {} as Router;
          const component = { viewModel: {}, childRouter } as ViewPortComponent;
          const moduleId = 'a';
          const viewPortInstruction = navInstruction.addViewPortInstruction('a', {
            strategy,
            moduleId,
            component
          } as ViewPortInstruction);
          expect(viewPortInstruction.strategy).toBe(strategy);
          expect(viewPortInstruction.moduleId).toBe(moduleId);
          expect(viewPortInstruction.component).toBe(component);
          expect(viewPortInstruction.childRouter).toBe(childRouter);
        }
      });

      it('throws when component is undefined/ null', () => {
        activationStrategies.forEach(strategy => {
          for (const component of [undefined, null] as any[]) {
            expect(() => {
              navInstruction.addViewPortInstruction('a', {
                strategy,
                moduleId: '',
                component
              } as ViewPortInstruction);
            }).toThrowError(new RegExp(`Cannot read property ['"]childRouter['"] of ${component}`));
          }
        });
      });

      describe('with "viewModel"', () => {

        it('adds', () => {
          activationStrategies.forEach(strategy => {
            const childRouter = {} as Router;
            const component = { viewModel: {}, childRouter } as ViewPortComponent;
            const viewModelSpec = () => class { } as Function;
            const viewPortInstruction = navInstruction.addViewPortInstruction('a', {
              strategy,
              viewModel: viewModelSpec,
              component: component
            } as ViewPortInstruction);
            expect(viewPortInstruction.strategy).toBe(strategy);
            expect(viewPortInstruction.viewModel).toBe(viewModelSpec);
            expect(viewPortInstruction.component).toBe(component);
            expect(viewPortInstruction.childRouter).toBe(childRouter);
          });
        });

      });

      it('throws when no "moduleId"/"viewModel" supplied', () => {
        activationStrategies.forEach(strategy => {
          expect(() => navInstruction.addViewPortInstruction('a', { component: {} } as any))
            .toThrowError(new RegExp(`Invalid instruction`));
        });
      });

    });
  });

  describe('getAllInstructions()', function _4_getAllInstructions_Tests() {
    let navInstruction: NavigationInstruction;
    beforeEach(function __setup__() {
      navInstruction = new NavigationInstruction({
        fragment: '',
        router: {} as Router,
        config: {}
      });
    });

    it('gets when it doesnt have childInstructions', () => {
      const allInstructions = navInstruction.getAllInstructions();
      expect(allInstructions.length).toBe(1);
      expect(allInstructions.includes(navInstruction)).toBe(true);
    });

    it('gets when it has childInstructions', () => {
      const childNavInstruction = new NavigationInstruction({
        fragment: '',
        router: {} as Router,
        config: {}
      });
      navInstruction.viewPortInstructions['a'] = {
        strategy: 'invoke-lifecycle',
        component: null,
        lifecycleArgs: null,
        childNavigationInstruction: childNavInstruction
      };
      const allInstructions = navInstruction.getAllInstructions();
      expect(allInstructions.length).toBe(2);
      const [firstInst, secondInst] = allInstructions;
      expect(firstInst).toBe(navInstruction);
      expect(secondInst).toBe(childNavInstruction);
    });

    it('gets correct instructions with deep nested level', () => {
      for (const strategy of activationStrategies) {
        const max = 10;
        let i = 0;
        let current = navInstruction;
        while (i < max) {
          current = addFakeViewPort(`a${i}`, current, strategy).childNavigationInstruction;
          i++;
        }
        const allInstructions = navInstruction.getAllInstructions();
        expect(allInstructions.length).toBe(max + 1);
        // test to ensure the instruction are recusively placed
        i = 0;
        current = navInstruction;
        while (i < max) {
          const childInstructions = getChildInstructions(current);
          expect(childInstructions.length).toBe(1);
          i++;
        }
      }
    });

    it('ignores view port without childNavigationInstruction', () => {
      for (const strategy of activationStrategies) {
        addFakeViewPort('a', navInstruction, strategy, false);
        const allInstructions = navInstruction.getAllInstructions();
        expect(allInstructions.length).toBe(1);
        expect(allInstructions[0]).toBe(navInstruction);
      }
    });

    function addFakeViewPort(name: string, navInstruction: NavigationInstruction, strategy: ActivationStrategyType, hasChild = true) {
      return navInstruction.viewPortInstructions[name] = {
        strategy: strategy,
        component: null,
        lifecycleArgs: null,
        childNavigationInstruction: hasChild
          ? new NavigationInstruction({
            fragment: '',
            router: {} as Router,
            config: {}
          })
          : null
      } as ViewPortInstruction;
    }

    function getChildInstructions(navInstruction: NavigationInstruction): NavigationInstruction[] {
      return Object.keys(navInstruction.viewPortInstructions).map(name => navInstruction.viewPortInstructions[name].childNavigationInstruction);
    }
  });

  fdescribe('wild card', function _5_wildcard__Tests() {

    let navInstruction: NavigationInstruction;
    beforeEach(function __setup__() {
      navInstruction = new NavigationInstruction({
        fragment: '',
        router: {} as Router,
        config: {}
      });
    });

    it('getWildCardName()', () => {
      [
        ['', ''],
        ['a/*', ''],
        ['a/*/', '/'],
        ['a/*/abc', '/abc'],
        ['a/*/*/abc', '/abc'],
        ['a/*abc', 'abc'],
        ['a**', ''],
        ['a*abcd', 'abcd'],
        ['*abcd', 'abcd'],
        ['****', '']
        // TODO: more cases
      ].forEach(([route, expectedName]) => {
        navInstruction.config.route = route;
        const name = navInstruction.getWildCardName();
        expect(name).toBe(expectedName);
      });
    });

    describe('getWildCardPath()', () => {
      type ITestCase = [
        /* route */ string, /* params */ Record<string, any>, /* queryString */ string, /* expected */ string
      ];
      const cases: ITestCase[] = [
        ['', {}, '', ''],
        ['*', {}, '', ''],
        ['a/*', {}, '', ''],
        ['a/*', { ['']: 'a' }, '', 'a'],
        ['a/*', {}, 'b', '?b'],
        ['a/*', { ['']: 5 }, '', 5 as any],
        // This theoretically never happens as params are Record<string, string>
        // but this test demonstrates its behavior, as taking the params as is
        (() => {
          const params = {};
          return ['a/*', { ['']: params }, '', params as any] as ITestCase;
        })(),
        ['a/*', { ['']: {} }, 'a', '[object Object]?a'],
        ['a/*', { ['']: 5 }, 'a', '5?a']
        // TODO: more cases
      ];
      cases.forEach(([route, params, queryString, expectedPath]) => {
        it(`gets ["${expectedPath}"] from ["${route}${queryString ? `?${queryString}` : ''}"]`, () => {
          navInstruction.config.route = route;
          navInstruction.params = params;
          navInstruction.queryString = queryString;
          const wildCardPath = navInstruction.getWildcardPath();
          expect(wildCardPath).toBe(expectedPath);
        });
      });
    });
  });

  describe('_commitChanges()', function _6_commitChanges_Tests() {
    // Quite challenging to add unit tests
    // todo: add unit tests
  });
});
