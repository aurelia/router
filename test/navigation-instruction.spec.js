import {History} from 'aurelia-history';
import {Container} from 'aurelia-dependency-injection';
import {AppRouter} from '../src/app-router';
import {PipelineProvider} from '../src/pipeline-provider';
import {NavigationInstruction} from '../src/navigation-instruction';

let absoluteRoot = 'http://aurelia.io/docs/';

class MockHistory extends History {
  activate() {}
  deactivate() {}
  navigate() {}
  navigateBack() {}
  getAbsoluteRoot() {
    return absoluteRoot;
  }
}

describe('NavigationInstruction', () => {
  let router;
  let history;

  beforeEach(() => {
    history = new MockHistory();
    router = new AppRouter(new Container(), history, new PipelineProvider(new Container()));
  });

  describe('getBaseUrl()', () => {
    let child;
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
        moduleId: parentRouteName,
      })
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
      });
    });

    it('should return the raw fragment when no wildcard exists', (done) => {
      router._createNavigationInstruction(parentRouteName).then(instruction => {
        instruction.params = { fake: 'fakeParams' };
        expect(instruction.getBaseUrl()).toBe(parentRouteName);
        done();
      });
    });

    describe('when a uri contains spaces', () => {

      it('should handle an encoded uri', (done) => {
        router._createNavigationInstruction('parent/parent%201').then(instruction => {
          expect(instruction.getBaseUrl()).toBe('parent/parent%201');;
          done();
        });
      });

      it('should encode the uri', (done) => {
        router._createNavigationInstruction('parent/parent 1').then(instruction => {
          expect(instruction.getBaseUrl()).toBe('parent/parent%201');
          done();
        });
      });

      it('should identify encoded fragments', (done) => {
        router._createNavigationInstruction('parent/parent%201/child/child%201').then(instruction => {
          expect(instruction.getBaseUrl()).toBe('parent/parent%201/');
          done();
        });
      });

      it('should identify fragments and encode them', (done) => {
        router._createNavigationInstruction('parent/parent 1/child/child 1').then(instruction => {
          expect(instruction.getBaseUrl()).toBe('parent/parent%201/');
          done();
        });
      });

    });

    describe('when using an empty parent route', () => {
      it('should return the non-empty matching parent route', (done) => {
        router._createNavigationInstruction('').then(parentInstruction => {
          router.currentInstruction = parentInstruction;
          router._refreshBaseUrl();
          child._createNavigationInstruction(childRouteName).then(instruction => {
            child._refreshBaseUrl();
            expect(child.baseUrl).toBe(parentRouteName);
            done();
          });
        });
      });
    });

    describe('when using an named parent route', () => {
      it('should return the non-empty matching parent route', (done) => {
        router._createNavigationInstruction(parentRouteName).then(parentInstruction => {
          router.currentInstruction = parentInstruction;
          router._refreshBaseUrl();
          child._createNavigationInstruction(childRouteName).then(instruction => {
            child._refreshBaseUrl();
            expect(child.baseUrl).toBe(parentRouteName);
            done();
          });
        });
      });
    });
  });
});
