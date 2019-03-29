import '../setup';
import { Container } from 'aurelia-dependency-injection';
import { NavigationInstruction, RouteConfig, Router, RouterConfiguration, ViewPortComponent } from '../../src/aurelia-router';
import { loadComponent, RouteLoader } from '../../src/route-loading';

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

  describe('invalid "viewModel" in ViewPortComponent', () => {
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
});
