import { Router } from '../../../src/router';
import { RouterConfiguration, NavigationInstruction } from '../../../src/aurelia-router';
import { PLATFORM } from 'aurelia-pal';

export class App {
  message = 'Hello World!';
  router: Router;

  configureRouter(config: RouterConfiguration, router: Router) {
    config
      .map([
        { route: ['', 'home'], name: 'home', moduleId: PLATFORM.moduleName('./landing') },
        { route: 'routePage', name: 'route.page', moduleId: PLATFORM.moduleName('./search') }
      ])
      .mapUnknownRoutes(instruction => {
        return { redirect: 'routePage' };
      });

    this.router = router;
  }

  activate() {
    console.log('App activated');
  }

}
