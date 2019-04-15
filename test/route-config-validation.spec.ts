import { validateRouteConfig } from '../src/router';
import { RouteConfig } from '../src/interfaces';

describe('RouteConfig validation', () => {
  let routeConfig: RouteConfig;

  it('ensures object', function _1_validateConfigObject__Tests() {
    [undefined, '', 5, Symbol(), function() {/**/}].forEach((v: any) => {
      expect(() => validateRouteConfig(v)).toThrowError('Invalid Route Config');
    });
  });

  describe('"route" validation', function _2_validateRouteProperty__Tests() {
    beforeEach(() => {
      routeConfig = {
        moduleId: 'a.js'
      } as RouteConfig;
    });

    it('throws when "route" is not a string', () => {
      [undefined, null, 5, Symbol(), function() {/**/}].forEach((v: any) => {
        routeConfig.route = v;
        expect(() => validateRouteConfig(routeConfig)).toThrowError(/You must specify a "route\:" pattern/);
      });
    });

    it('ensures valid when "route" is a string', () => {
      ['', 'not an empty string'].forEach((route) => {
        routeConfig.route = route;
        expect(() => validateRouteConfig(routeConfig)).not.toThrow();
      });
    });
  });

  describe('view port view model resolution validation', function _3_ensureViewPortPointer__Tests() {
    beforeEach(() => {
      routeConfig = { route: '' };
    });

    it('throws when there is no "moduleId", "redirect", "navigationStrategy" or "viewPorts" in config', () => {
      const expectedError = /You must specify a "moduleId:", "redirect:", "navigationStrategy:", or "viewPorts:"\./;
      expect(() => validateRouteConfig(routeConfig)).toThrowError(expectedError);
    });

    ['moduleId', 'redirect', 'navigationStrategy', 'viewPorts'].forEach((prop: string) => {
      it(`does not throw when there is at least "${prop}"`, () => {
        routeConfig[prop] = prop === 'viewModel' ? function() {/**/} : {};
        expect(() => validateRouteConfig(routeConfig)).not.toThrow();
      });
    });
  });
});

