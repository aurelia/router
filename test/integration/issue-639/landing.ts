import { inject } from 'aurelia-framework';
import { Router, activationStrategy, Redirect } from '../../../src/aurelia-router';

@inject(Router)
export class Landing {

  router: Router;
  params: Record<string, any>;

  constructor(router: Router) {
    this.router = router;
  }

  activate(params: Record<string, any>) {
    this.params = params;
  }

  goto() {
    this.router.navigateToRoute('home', { key: Math.random(), compareQueryParams: true });
  }
}
