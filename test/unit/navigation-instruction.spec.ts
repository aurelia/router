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

  fdescribe('addViewPortInstruction()', function _3_addViewPortInstruction_Tests() {
    const activationStrategies: ActivationStrategyType[] = ['replace', 'invoke-lifecycle', 'no-change'];
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

      it('throws when viewModel is undefined / null', () => {
        activationStrategies.forEach(strategy => {
          for (const component of [undefined, null] as any[]) {
            expect(() => {
              navInstruction.addViewPortInstruction('a', strategy, 'aa', component);
            }).toThrowError(new RegExp(`Cannot read property ['"]childRouter['"] of ${component}`));
          };
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
    });
  });
});
