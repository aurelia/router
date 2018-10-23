import { NavigationOptions } from 'aurelia-history';
import { Router } from './router';

/**@internal */
declare module 'aurelia-history' {
  interface NavigationOptions {
    useAppRouter?: boolean;
  }
}

/**
* When a navigation command is encountered, the current navigation
* will be cancelled and control will be passed to the navigation
* command so it can determine the correct action.
*/
export interface NavigationCommand {
  navigate: (router: Router) => void;
  /**@internal */
  shouldContinueProcessing?: boolean;
  /**@internal */
  setRouter?: (router: Router) => void;
}

/**
* Determines if the provided object is a navigation command.
* A navigation command is anything with a navigate method.
*
* @param obj The object to check.
*/
export function isNavigationCommand(obj: any): obj is NavigationCommand {
  return obj && typeof obj.navigate === 'function';
}

/**
* Used during the activation lifecycle to cause a redirect.
*/
export class Redirect implements NavigationCommand {

  url: string;
  /**@internal */
  options: NavigationOptions;
  /**@internal */
  shouldContinueProcessing: boolean;

  router: Router;

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
    let navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
    navigatingRouter.navigate(this.url, this.options);
  }
}

/**
* Used during the activation lifecycle to cause a redirect to a named route.
*/
// extends Redirect to avoid having to do instanceof check twice
export class RedirectToRoute extends Redirect {

  route: string;
  params: any;

  /**
   * @param route The name of the route.
   * @param params The parameters to be sent to the activation method.
   * @param options The options to use for navigation.
   */
  constructor(route: string, params: any = {}, options: NavigationOptions = {}) {
    super('', options);
    this.route = route;
    this.params = params;
  }

  /**
  * Called by the navigation pipeline to navigate.
  *
  * @param appRouter The router to be redirected.
  */
  navigate(appRouter: Router): void {
    let navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
    navigatingRouter.navigateToRoute(this.route, this.params, this.options);
  }
}
