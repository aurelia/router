import {
  Redirect,
  RedirectToRoute,
  isNavigationCommand,
  NavigationCommand
} from '../../src';
import { MockRouter } from '../shared';

describe('NavigationCommand', function NavigationCommand_Tests() {

  describe('isNavigationCommand', function isNavigationCommand_Tests() {
    it('should return true for object which has a navigate method', () => {
      let nc: NavigationCommand = {
        // tslint:disable-next-line
        navigate() { }
      };

      expect(isNavigationCommand(nc)).toBe(true);
    });

    it('should return false for everything that does not have a navigate method', () => {
      expect(isNavigationCommand(true)).toBe(false);
      expect(isNavigationCommand(1)).toBe(false);
      expect(isNavigationCommand({})).toBe(false);
    });
  });

  describe('Redirect', function Redirect_Tests() {
    it('should accept url in constructor and pass this url to passed router\'s navigate method as first parameter', () => {
      let testurl = 'http://aurelia.io/';
      let redirect = new Redirect(testurl);
      let mockrouter: MockRouter = {
        url: '',
        navigate(url: string) {
          this.url = url;
        }
      } as MockRouter;

      redirect.setRouter(mockrouter);

      expect(mockrouter.url).toBe('');

      redirect.navigate(mockrouter);

      expect(mockrouter.url).toBe(testurl);
    });

    it('should accept options in constructor to use the app router', () => {
      let testurl = 'http://aurelia.io/';
      let redirect = new Redirect(testurl, { useAppRouter: true });
      let mockrouter: MockRouter = {
        url: '',
        navigate(url: string) {
          this.url = url;
        }
      } as any;
      let mockapprouter: MockRouter = {
        url: '',
        navigate(url: string) {
          this.url = url;
        }
      } as any;

      redirect.setRouter(mockrouter);

      expect(mockapprouter.url).toBe('');

      redirect.navigate(mockapprouter);

      expect(mockrouter.url).toBe('');
      expect(mockapprouter.url).toBe(testurl);
    });
  });

  describe('RedirectToRoute', function RedirectToRoute_Tests() {
    it('should accept url in constructor and pass this url to passed router\'s navigate method as first parameter', () => {
      let testroute = 'test';
      let testparams = { id: 1 };
      let redirect = new RedirectToRoute(testroute, testparams);
      let mockrouter: MockRouter = {
        route: '',
        params: {},
        navigateToRoute(route: string, params: Record<string, any>) {
          this.route = route;
          this.params = params;
        }
      } as any;

      redirect.setRouter(mockrouter);

      expect(mockrouter.route).toBe('');
      expect(mockrouter.params).toEqual({});

      redirect.navigate(mockrouter);

      expect(mockrouter.route).toBe(testroute);
      expect(mockrouter.params).toEqual(testparams);
    });

    it('should accept options in constructor to use the app router', () => {
      let testroute = 'test';
      let testparams = { id: 1 };
      let redirect = new RedirectToRoute(testroute, testparams, { useAppRouter: true });
      let mockrouter: MockRouter = {
        route: '',
        params: {},
        navigateToRoute(route: string, params: Record<string, any>) {
          this.route = route;
          this.params = params;
        }
      } as any;

      let mockapprouter: MockRouter = {
        route: '',
        params: {},
        navigateToRoute(route: string, params: Record<string, any>) {
          this.route = route;
          this.params = params;
        }
      } as any;

      redirect.setRouter(mockrouter);

      expect(mockapprouter.route).toBe('');
      expect(mockapprouter.params).toEqual({});

      redirect.navigate(mockapprouter);

      expect(mockrouter.route).toBe('');
      expect(mockrouter.params).toEqual({});

      expect(mockapprouter.route).toBe(testroute);
      expect(mockapprouter.params).toEqual(testparams);
    });
  });
});
