import { loadComponent, RouteLoader } from '../../../src/route-loading';
import { NavigationInstruction, RouteConfig, Router, ViewPortComponent, ViewPort, RouterConfiguration } from '../../../src';
import { Container } from 'aurelia-framework';

describe('RouteLoading -- loadComponent()', function loadComponent__Tests() {
  let container: Container;
  let router: Router;
  let routeLoader: RouteLoader;
  let navInstruction: NavigationInstruction;
  let config: RouteConfig;
  let vpComponent: ViewPortComponent;

  beforeEach(function __setup__() {
    routeLoader = {
      loadRoute(router: Router, config: RouteConfig, nav: NavigationInstruction): Promise<ViewPortComponent> {
        return Promise.resolve(vpComponent);
      }
    };
    navInstruction = {
      router
    } as any;
  });

  describe('invalid "viewModel"', function _1_invalid_viewModel__Tests() {
    [null, undefined].forEach((viewModel: any) => {
      it(`throws when view model is ${viewModel}`, async () => {
        vpComponent = { router, viewModel: viewModel };
        try {
          await loadComponent(routeLoader, navInstruction, config);
          expect(0).toBe(1, 'It should not have loaded.');
        } catch (ex) {
          expect(ex.toString()).toBe(`TypeError: Cannot use 'in' operator to search for 'configureRouter' in ${viewModel}`);
        }
      });
    });

    ['a', 5, Symbol()].forEach((viewModel: any) => {
      it(`throws when view model is primitive type ${typeof viewModel}`, async () => {
        vpComponent = { router, viewModel: viewModel };
        try {
          await loadComponent(routeLoader, navInstruction, config);
          expect(0).toBe(1, 'It should not have loaded.');
        } catch (ex) {
          expect(ex.toString()).toContain(`Cannot use 'in' operator to search for 'configureRouter' in ${String(viewModel)}`);
        }
      });
    });
  });

  describe('valid "viewModel"', function _2_valid_viewModel__Tests() {
    let viewModel: any;
    let childContainer: Container;
    let childRouter: Router;
    beforeEach(() => {
      router = {} as Router;
      config = {} as RouteConfig;
      navInstruction.router = router;
      navInstruction.config = config;
      viewModel = {};
    });

    it('loads', async () => {
      const options = {};
      router.options = options;
      config.settings = options;
      vpComponent = { viewModel, childContainer } as any;
      const component = await loadComponent(routeLoader, navInstruction, config);

      expect(component.router).toBe(router);
      expect(component.router.options).toBe(options);
      expect(component.config).toBe(config);
      expect(component.config.settings).toBe(options);
    });

    it('loads and invoke "configureRouter"', async () => {
      let configured = 0;
      const routeConfiguration: RouterConfiguration = {} as any;
      const options = {};
      router.options = options;
      config.settings = options;
      childRouter = {
        configure: (callback: (c: RouterConfiguration) => any) => {
          callback(routeConfiguration);
        }
      } as any;
      childContainer = {
        getChildRouter: () => {
          return childRouter;
        }
      } as any;
      viewModel.configureRouter = function(c: RouterConfiguration, r: Router, arg_1: any, arg_2: any, arg_3: any) {
        expect(c).toBe(routeConfiguration);
        expect(r).toBe(childRouter);
        expect(arg_1).toBe(arg1);
        expect(arg_2).toBe(arg2);
        expect(arg_3).toBe(arg3);
        configured = 1;
      };
      vpComponent = { viewModel, childContainer } as any;
      const arg1 = {};
      const arg2 = {};
      const arg3 = {};
      navInstruction.lifecycleArgs = [arg1, arg2, arg3] as any;
      const component = await loadComponent(routeLoader, navInstruction, config);

      expect(component.router).toBe(router);
      expect(component.router.options).toBe(options);
      expect(component.config).toBe(config);
      expect(component.config.settings).toBe(options);
      expect(component.childRouter).toBe(childRouter);
      expect(configured).toBe(1);
    });
  });
});
