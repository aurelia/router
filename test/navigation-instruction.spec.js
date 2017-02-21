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
    const childRouteName = 'child';

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
      child = router.createChild(new Container());
      child.addRoute({
        name: childRouteName,
        route: childRouteName,
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
