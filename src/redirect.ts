import { NavigationOptions } from 'aurelia-history';
import { Router } from './router';
import { NavigationCommand } from './utilities-navigation-command';

/**
* Used during the activation lifecycle to cause a redirect.
*/
export class Redirect implements NavigationCommand {
  url: string;
  /**@internal */
  options: NavigationOptions;
  /**@internal */
  shouldContinueProcessing: boolean;
  private router: Router;
  /**
   * @param url The URL fragment to use as the navigation destination.
   * @param options The navigation options.
   */
  constructor(url: string, options: NavigationOptions = {}) {
    this.url = url;
    this.options = Object.assign({ trigger: true, replace: true }, options);
    this.shouldContinueProcessing = false;
  }
  /**
   * Called by the activation system to set the child router.
   *
   * @param router The router.
   */
  setRouter(router: Router): void {
    this.router = router;
  }
  /**
   * Called by the navigation pipeline to navigate.
   *
   * @param appRouter The router to be redirected.
   */
  navigate(appRouter: Router): void {
    let options = this.options;
    let navigatingRouter = options.useAppRouter ? appRouter : (this.router || appRouter);
    navigatingRouter.navigate(this.url, options);
  }
}
