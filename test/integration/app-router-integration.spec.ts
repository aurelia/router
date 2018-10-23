// import { RouteLoader } from '../../src/route-loader';
import { bootstrap } from 'aurelia-bootstrapper';
// import { bootstrap } from './bootstrap';
import { RouteLoader, AppRouter, Router, RouterConfiguration } from '../../src/index';
import { StageComponent, ComponentTester } from 'aurelia-testing';
import { Aurelia, PLATFORM } from 'aurelia-framework';
import '../shared';

describe('AppRouter - Integration', function AppRouter_Integration_Tests() {
  let component: ComponentTester;

  afterEach(done => {
    component.dispose();
    done();
  });

  it('should use route as primary property', done => {
    component = StageComponent
      .withResources()
      .inView('<div></div>')
      .boundTo({ name: 'b' });

    configure(component);

    component.create(bootstrap)
      .then(() => {
        expect(document.querySelector('div')).toBeTruthy();
        done();
      })
      .catch(done.fail);
  });
});

function configure(component: ComponentTester) {
  component.bootstrap((aurelia: Aurelia) => {
    aurelia.use
      .defaultBindingLanguage()
      .defaultResources()
      .history()
      .router()
      // .developmentLogging() // too much logging
    ;

    aurelia.use.container.viewModel = {
      configureRouter: (config: RouterConfiguration, router: Router) => {
        config.map([
          { route: 'a', name: 'a' },
          { route: 'b', name: 'b' }
        ]);
      }
    };
    return aurelia.use;
  });
}
