import { NavigationOptions } from 'aurelia-history';
import { Router } from './router';
import { NavigationCommand } from './utilities-navigation-command';

/**
 * Used during the activation lifecycle to cause a redirect to a named route.
 */
export class RedirectToRoute implements NavigationCommand {
  route: string;
  params: any;
  /**@internal */
  options: NavigationOptions;
  /**@internal */
  shouldContinueProcessing: boolean;
  /**@internal */
  router: Router;
  /**
   * @param route The name of the route.
   * @param params The parameters to be sent to the activation method.
   * @param options The options to use for navigation.
   */
  constructor(route: string, params: any = {}, options: NavigationOptions = {}) {
    this.route = route;
    this.params = params;
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
    navigatingRouter.navigateToRoute(this.route, this.params, options);
  }
}
