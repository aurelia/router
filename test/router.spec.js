import {History} from 'aurelia-history';
import {Container} from 'aurelia-dependency-injection';
import {AppRouter, PipelineProvider} from '../src/index';

describe('the router', () => {
  let router;
  beforeEach(() => {
    router = new AppRouter(new History(), new PipelineProvider(new Container()));
  });

  it('should have some tests', () => {
    expect(router).not.toBe(null);
  });

  describe('addRoute', () => {
    it('should register named routes', () => {
      const child = router.createChild(new Container()); 

      router.addRoute({ name: 'parent', route: 'parent', moduleId: 'parent' });
      child.addRoute({ name: 'child', route: 'child', moduleId: 'child' });

      expect(child.hasRoute('child')).toBe(true);
      expect(child.hasRoute('parent')).toBe(true);
      expect(child.hasOwnRoute('child')).toBe(true);
      expect(child.hasOwnRoute('parent')).toBe(false);

      expect(router.hasRoute('child')).toBe(false);
      expect(router.hasRoute('parent')).toBe(true);
      expect(router.hasOwnRoute('child')).toBe(false);
      expect(router.hasOwnRoute('parent')).toBe(true);
    });

    it('should add a route to navigation if it has a nav=true', () => {
      var testRoute = {};

      router.addRoute({ route: 'test', moduleId: 'test', title: 'Resume', nav: true }, testRoute);
      expect(router.navigation).toContain(testRoute);
    });

    it('should not add a route to navigation if it has a nav=false', () => {
      var testRoute = {};

      router.addRoute({ route: 'test', moduleId: 'test', title: 'Resume', nav: false }, testRoute);
      expect(router.navigation).not.toContain(testRoute);
    });
  });

  describe('generate', () => {
    it('should generate route URIs', () => {
      router.configure(config => {
        config.map({ name: 'test', route: 'test/:id', moduleId: './test' });
      });

      expect(router.generate('test', { id: 1 })).toBe('/test/1');
    });

    it('should generate absolute paths', () => {
      router.configure(config => {
        config.map({ name: 'test', route: 'test', moduleId: './test' });
      });

      router.baseUrl = 'root';
      router.history.root = '/';

      expect(router.generate('test', null, { absolute: true })).toBe('/root/test');
    })

    it('should delegate to parent when not configured', () => {
      const child = router.createChild(new Container()); 

      router.configure(config => {
        config.map({ name: 'test', route: 'test/:id', moduleId: './test' });
      });

      expect(child.generate('test', { id: 1 })).toBe('/test/1');
    });

    it('should delegate to parent when generating unknown route', () => {
      const child = router.createChild(new Container());

      router.configure(config => {
        config.map({ name: 'parent', route: 'parent/:id', moduleId: './test' });
      });

      child.configure(config => {
        config.map({ name: 'child', route: 'child/:id', moduleId: './test' });
      });

      expect(child.generate('child', { id: 1 })).toBe('/child/1');
      expect(child.generate('parent', { id: 1 })).toBe('/parent/1');
    });
  });
});
