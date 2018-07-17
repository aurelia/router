import {History} from 'aurelia-history';
import {Container} from 'aurelia-dependency-injection';
import {AppRouter} from '../src/app-router';
import {PipelineProvider} from '../src/pipeline-provider';
import {NavigationInstruction} from '../src/navigation-instruction';
import {RouterConfiguration} from '../src/router-configuration';

let absoluteRoot = 'http://aurelia.io/docs/';

class MockHistory extends History {
  activate() {}
  deactivate() {}
  navigate() {}
  navigateBack() {}
  setTitle() {}
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

  describe('build title', () => {
    let child;
    let config;
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
          instruction.viewPortInstructions['default'] = { childNavigationInstruction: childInstruction };
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
          instruction.viewPortInstructions['default'] = { childNavigationInstruction: childInstruction };
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
          instruction.viewPortInstructions['default'] = { childNavigationInstruction: childInstruction };
          instruction._updateTitle();
          expect(history.setTitle).toHaveBeenCalledWith('child <3 parent');
          expect(history.setTitle).not.toHaveBeenCalledWith('child </3 parent');
          done();
        });
      });
    });
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
});
