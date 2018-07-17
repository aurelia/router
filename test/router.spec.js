import {History} from 'aurelia-history';
import {Container} from 'aurelia-dependency-injection';
import {AppRouter} from '../src/app-router';
import {PipelineProvider} from '../src/pipeline-provider';

let absoluteRoot = 'http://aurelia.io/docs/';

export class MockHistory extends History {
  activate() {}
  deactivate() {}
  navigate() {}
  navigateBack() {}
  getAbsoluteRoot() {
    return absoluteRoot;
  }
  setState(key, value) {}
  getState(key) {
    return null;
  }
}

describe('the router', () => {
  let router;
  let history;
  beforeEach(() => {
    history = new MockHistory();
    router = new AppRouter(new Container(), history, new PipelineProvider(new Container()));
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
      const config = { route: 'test', moduleId: 'test', title: 'Resume', nav: true };
      const navModel = router.createNavModel(config);

      router.addRoute(config, navModel);
      expect(router.navigation).toContain(navModel);
    });

    it('should not add a route to navigation if it has a nav=false', () => {
      let testRoute = {};

      router.addRoute({ route: 'test', moduleId: 'test', title: 'Resume', nav: false }, testRoute);
      expect(router.navigation).not.toContain(testRoute);
    });

    it('should reject dynamic routes specifying nav=true with no href', () => {
      expect(() => router.addRoute({ route: 'test/:id', href: 'test', moduleId: 'test', nav: true })).not.toThrow();
      expect(() => router.addRoute({ route: 'test/:id', moduleId: 'test', nav: true })).toThrow();
    });

    it('should add a route with multiple view ports', () => {
      expect(() => router.addRoute({ route: 'multiple/viewports', viewPorts: {
        'default': { moduleId: 'test1' },
        'number2': { moduleId: 'test2' }
      }})).not.toThrow();
    });

    it('should map a routeconfig with an array of routes to multiple routeconfigs with one route each', () => {
      router.addRoute({ route: ['test1', 'test2'], moduleId: 'test', nav: true });
      expect(router.routes[0].route).toEqual('test1');
      expect(router.routes[1].route).toEqual('test2');
    });
  });

  describe('generate', () => {
    it('should generate route URIs', (done) => {
      const child = router.createChild(new Container());
      child.baseUrl = 'child-router';

      Promise.all([
        router.configure(config => config.map({ name: 'parent', route: 'parent', moduleId: './test' })),
        child.configure(config => config.map({ name: 'child', route: 'child', moduleId: './test' }))
      ]).then(() => {
        expect(router.generate('parent')).toBe('#/parent');
        expect(child.generate('parent')).toBe('#/parent');
        expect(child.generate('child')).toBe('#/child-router/child');

        router.history._hasPushState = true;

        expect(router.generate('parent')).toBe('/parent');
        expect(child.generate('parent')).toBe('/parent');
        expect(child.generate('child')).toBe('/child-router/child');

        done();
      });
    });

    it('should delegate to parent when not configured', (done) => {
      const child = router.createChild(new Container());

      router.configure(config => config.map({ name: 'test', route: 'test/:id', moduleId: './test' }))
        .then(() => {
          expect(child.generate('test', { id: 1 })).toBe('#/test/1');
          done();
        });
    });

    it('should delegate to parent when generating unknown route', (done) => {
      const child = router.createChild(new Container());

      Promise.all([
        router.configure(config => config.map({ name: 'parent', route: 'parent/:id', moduleId: './test' })),
        child.configure(config => config.map({ name: 'child', route: 'child/:id', moduleId: './test' }))
      ]).then(() => {
        expect(child.generate('child', { id: 1 })).toBe('#/child/1');
        expect(child.generate('parent', { id: 1 })).toBe('#/parent/1');
        done();
      });
    });

    it('should return a fully-qualified URL when options.absolute is true', (done) => {
      const child = router.createChild(new Container());
      let options = { absolute: true };

      Promise.all([
        router.configure(config => config.map({ name: 'parent', route: 'parent/:id', moduleId: './test' })),
        child.configure(config => config.map({ name: 'test', route: 'test/:id', moduleId: './test' }))
      ])
        .then(() => {
          expect(child.generate('test', { id: 1 }, options)).toBe(`${absoluteRoot}#/test/1`);
          expect(child.generate('parent', { id: 2 }, options)).toBe(`${absoluteRoot}#/parent/2`);
          router.history._hasPushState = true;
          expect(child.generate('test', { id: 1 }, options)).toBe(`${absoluteRoot}test/1`);
          expect(child.generate('parent', { id: 2 }, options)).toBe(`${absoluteRoot}parent/2`);
          done();
        });
    });
  });

  describe('navigate', () => {
    it('should navigate to absolute paths', (done) => {
      const options = {};
      spyOn(history, 'navigate');

      const child = router.createChild(new Container());
      child.baseUrl = 'child-router';

      Promise.all([
        router.configure(config => {
          config.map([
            { name: 'parent', route: 'parent/:id', moduleId: './test' },
            { name: 'parent-empty', route: '', moduleId: './parent-empty' }
          ]);
        }),
        child.configure(config => {
          config.map([
            { name: 'child', route: 'child/:id', moduleId: './test' },
            { name: 'empty', route: '', moduleId: './empty' }
          ]);
        })
      ]).then(() => {
        router.navigate('', options);
        expect(history.navigate).toHaveBeenCalledWith('#/', options);
        history.navigate.calls.reset();

        router.navigate('#/test1', options);
        expect(history.navigate).toHaveBeenCalledWith('#/test1', options);
        history.navigate.calls.reset();

        router.navigate('/test2', options);
        expect(history.navigate).toHaveBeenCalledWith('#/test2', options);
        history.navigate.calls.reset();

        router.navigate('test3', options);
        expect(history.navigate).toHaveBeenCalledWith('#/test3', options);
        history.navigate.calls.reset();

        child.navigate('#/test4', options);
        expect(history.navigate).toHaveBeenCalledWith('#/test4', options);
        history.navigate.calls.reset();

        child.navigate('/test5', options);
        expect(history.navigate).toHaveBeenCalledWith('#/test5', options);
        history.navigate.calls.reset();

        child.navigate('test6', options);
        expect(history.navigate).toHaveBeenCalledWith('#/child-router/test6', options);
        history.navigate.calls.reset();

        child.navigate('#/child-router/test7', options);
        expect(history.navigate).toHaveBeenCalledWith('#/child-router/test7', options);
        history.navigate.calls.reset();

        child.navigate('/child-router/test8', options);
        expect(history.navigate).toHaveBeenCalledWith('#/child-router/test8', options);
        history.navigate.calls.reset();

        child.navigate('child-router/test9', options);
        expect(history.navigate).toHaveBeenCalledWith('#/child-router/child-router/test9', options);
        history.navigate.calls.reset();

        child.navigate('', options);
        expect(history.navigate).toHaveBeenCalledWith('#/child-router/', options);
        history.navigate.calls.reset();

        done();
      });
    });

    it('should navigate to named routes', (done) => {
      const options = {};
      spyOn(history, 'navigate');

      router.configure(config => config.map({ name: 'test', route: 'test/:id', moduleId: './test' }))
        .then(() => {
          router.navigateToRoute('test', { id: 123 }, options);
          expect(history.navigate).toHaveBeenCalledWith('#/test/123', options);
          done();
        });
    });
  });

  describe('_createNavigationInstruction', () => {
    it('should reject when router not configured', (done) => {
      router._createNavigationInstruction()
        .then(x => expect(true).toBeFalsy('should have rejected'))
        .catch(reason => expect(reason).toBeTruthy())
        .then(done);
    });

    it('should reject when route not found', (done) => {
      router.configure(config => config.map({ name: 'test', route: 'test/:id', moduleId: './test' }))
        .then(() => router._createNavigationInstruction('test'))
        .then(() => expect(true).toBeFalsy('should have rejected'))
        .catch(reason => expect(reason).toBeTruthy())
        .then(done);
    });

    it('should resolve matching routes', (done) => {
      router.configure(config => config.map({ name: 'test', route: 'test/:id', moduleId: './test' }))
        .then(() => router._createNavigationInstruction('test/123?foo=456'))
        .then(x => expect(x).toEqual(jasmine.objectContaining({ fragment: 'test/123', queryString: 'foo=456' })))
        .catch(reason => fail(reason))
        .then(done);
    });

    describe('should match routes with same pattern based on href', () => {
      it('', (done) => {
        router.configure(config => config.map([
          { name: 'a', route: 'test/:p', moduleId: './test', href: '/test/a' },
          { name: 'b', route: 'test/:p', moduleId: './test', href: '/test/b' }
        ]))
          .then(() => router._createNavigationInstruction('test/b?foo=456'))
          .then(i => {
            expect(i.fragment).toEqual('test/b');
            expect(i.queryString).toEqual('foo=456');
            expect(i.params.p).toEqual('b');
            expect(i.config.name).toEqual('b');
          })
          .catch(reason => fail(reason))
          .then(done);
      });

      it('when fragment matches the child router', (done) => {
        const childRouter = router.createChild(new Container());

        router.configure(config => config.map([
          { name: 'a', route: 'parent/:p', moduleId: './parent', href: '/parent/a' },
          { name: 'b', route: 'parent/:p', moduleId: './parent', href: '/parent/b' }
        ]))
          .then(() => childRouter.configure(config => config.map([
            { name: 'c', route: 'child/:p', moduleId: './child', href: '/child/c' },
            { name: 'd', route: 'child/:p', moduleId: './child', href: '/child/d' },
          ])))
          .then(() => router._createNavigationInstruction('parent/b/child/c?foo=456'))
          .then(i => {
            expect(i.fragment).toEqual('parent/b/child/c');
            expect(i.queryString).toEqual('foo=456');
            expect(i.params.p).toEqual('b');
            expect(i.config.name).toEqual('b');
          })
          .then(() => childRouter._createNavigationInstruction('child/c?foo=456'))
          .then(i => {
            // This failing test needs to be implemented.
            // expect(i.fragment).toEqual('child/c');
            // expect(i.queryString).toEqual('foo=456');
            // expect(i.params.p).toEqual('c');
            // expect(i.config.name).toEqual('c');
          })
          .catch(reason => fail(reason))
          .then(done);
      });
    });

    it('should be case insensitive by default', (done) => {
      router.configure(config => config.map({ name: 'test', route: 'test/:id', moduleId: './test' }))
        .then(() => router._createNavigationInstruction('TeSt/123?foo=456'))
        .then(x => expect(x).toEqual(jasmine.objectContaining({ fragment: 'TeSt/123', queryString: 'foo=456' })))
        .catch(reason => fail(reason))
        .then(done);
    });

    it('should reject when route is case sensitive', (done) => {
      router.configure(config => config.map({ name: 'test', route: 'Test/:id', moduleId: './test', caseSensitive: true }))
        .then(() => router._createNavigationInstruction('test/123'))
        .then(() => expect(true).toBeFalsy('should have rejected'))
        .catch(reason => expect(reason).toBeTruthy())
        .then(done);
    });

    describe('catchAllHandler', () => {
      it('should use a parent routers catchAllHandler if one exists', (done) => {
        const child = router.createChild(new Container());
        child.baseUrl = 'empty';
        Promise.all([
          router.configure(config => {
            config.unknownRouteConfig = 'test';
            config.mapRoute({route: 'foo', moduleId: './empty'});
          }),
          child.configure(config => {
            config.mapRoute({ route: '', moduleId: './child-empty' });
          })
        ])
        .then(() => router._createNavigationInstruction('foo/bar/123?bar=456'))
        .then(parentInstruction => {
          expect(parentInstruction.config.moduleId).toEqual('./empty');
          return child._createNavigationInstruction('bar/123?bar=456', parentInstruction);
        })
        .then(childInstruction => expect(childInstruction.config.moduleId).toEqual('test'))
        .catch(fail)
        .then(done);
      });

      it('should use string moduleId handler', (done) => {
        router
          .configure(config => {
            config.unknownRouteConfig = 'test';
          })
          .then(() => router._createNavigationInstruction('foo/123?bar=456'))
          .then(instruction => expect(instruction.config.moduleId).toEqual('test'))
          .catch(fail)
          .then(done);
      });

      it('should use route config handler', (done) => {
        router
          .configure(config => {
            config.unknownRouteConfig = { moduleId: 'test' };
          })
          .then(() => router._createNavigationInstruction('foo/123?bar=456'))
          .then(instruction => expect(instruction.config.moduleId).toEqual('test'))
          .catch(fail)
          .then(done);
      });

      it('should use function handler', (done) => {
        router
          .configure(config => {
            config.unknownRouteConfig = instruction => ({ moduleId: 'test' });
          })
          .then(() => router._createNavigationInstruction('foo/123?bar=456'))
          .then(instruction => expect(instruction.config.moduleId).toEqual('test'))
          .catch(fail)
          .then(done);
      });

      it('should use async function handler', (done) => {
        router
          .configure(config => {
            config.unknownRouteConfig = instruction => Promise.resolve({ moduleId: 'test' });
          })
          .then(() => router._createNavigationInstruction('foo/123?bar=456'))
          .then(instruction => expect(instruction.config.moduleId).toEqual('test'))
          .catch(fail)
          .then(done);
      });

      it('should pass instruction to function handler', (done) => {
        router
          .configure(config => {
            config.unknownRouteConfig = instruction => {
              expect(instruction.fragment).toBe('foo/123');
              expect(instruction.queryString).toBe('bar=456');
              expect(instruction.config).toBe(null);

              return { moduleId: 'test' };
            };
          })
          .then(() => router._createNavigationInstruction('foo/123?bar=456'))
          .then(instruction => expect(instruction.config.moduleId).toEqual('test'))
          .catch(fail)
          .then(done);
      });

      it('should throw on invalid handlers', () => {
        expect(() => {
          router.handleUnknownRoutes(null);
        }).toThrow();
      });

      it('should reject invalid configs', (done) => {
        router
          .configure(config => {
            config.unknownRouteConfig = instruction => null;
          })
          .then(() => router._createNavigationInstruction('foo/123?bar=456'))
          .then(() => fail('should have rejected'))
          .catch(done);
      });
    });
  });

  describe('configure', () => {
    it('notifies when configured', (done) => {
      expect(router.isConfigured).toBe(false);

      router.ensureConfigured().then(() => {
        expect(router.isConfigured).toBe(true);
        done();
      });

      router.configure(config => config.map({ route: '', moduleId: './test' }));
    });

    it('notifies when already configured', (done) => {
      expect(router.isConfigured).toBe(false);

      router.configure(config => config.map({ route: '', moduleId: './test' }))
        .then(() => {
          expect(router.isConfigured).toBe(true);

          router.ensureConfigured().then(() => {
            expect(router.isConfigured).toBe(true);
            done();
          });
        });
    });

    it('waits for async callbacks', (done) => {
      let resolve;
      let promise = new Promise(r => resolve = r);

      expect(router.isConfigured).toBe(false);

      router.configure(config => {
        return promise.then(x => {
          config.map({ route: '', moduleId: './test' });
        });
      });

      expect(router.isConfigured).toBe(true);
      expect(router.routes.length).toBe(0);

      router.ensureConfigured().then(() => {
        expect(router.routes.length).toBe(1);
        done();
      });

      resolve();
    });
  });

  describe('refreshNavigation', () => {
    let staticHref;

    beforeEach((done) => {
      staticHref = '#/a/static/href';
      router.baseUrl = 'initial-root';

      router.configure(config => config.map([
        { name: 'dynamic', route: 'dynamic', moduleId: 'dynamic', nav: true },
        { name: 'static', route: 'static', moduleId: 'static', href: staticHref, nav: true }])).then(() => {
          router.refreshNavigation();
          done();
        });
    });

    it('updates a dynamic href ', () => {
      router.baseUrl = 'updated-root';
      router.refreshNavigation();

      expect(router.navigation[0].href).toEqual('#/updated-root/dynamic');
    });

    it('respects a static href ', () => {
      router.baseUrl = 'updated-root';
      router.refreshNavigation();

      expect(router.navigation[1].href).toEqual(staticHref);
    });
  });
});
