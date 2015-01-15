import {History} from 'aurelia-history';
import {Container} from 'aurelia-dependency-injection';
import {AppRouter, PipelineProvider} from '../src/index';

describe('the router', () => {
  it('should have some tests', () => {
    var router = new AppRouter(new History(), new PipelineProvider(new Container()));
    expect(router).not.toBe(null);
  });

  describe('addRoute', () => {

    it('should add a route to navigation if it has a nav=true', () => {
      var router = new AppRouter(new History(), new PipelineProvider(new Container())),
          testRoute = {};

      router.addRoute({ route: 'test', moduleId: 'test', title: 'Resume', nav: true }, testRoute);
      expect(router.navigation).toContain(testRoute);
    });

    it('should not add a route to navigation if it has a nav=false', () => {
      var router = new AppRouter(new History(), new PipelineProvider(new Container())),
          testRoute = {};

      router.addRoute({ route: 'test', moduleId: 'test', title: 'Resume', nav: false }, testRoute);
      expect(router.navigation).not.toContain(testRoute);
    });
  });
});
