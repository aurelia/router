import { Router } from '../../../src/aurelia-router';

export class Search {
  router: Router;
  params: Record<string, any> = {};

  activate(params: Record<string, any>) {
    this.params = params;
    console.log('Search activate:', params);
  }

  home() {
    this.router.navigateToRoute('home');
  }
}
