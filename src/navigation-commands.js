import * as core from 'core-js';
import {Router} from './router';

/**
 * Determines if the provided object is a navigation command.
 * A navigation command is anything with a navigate method.
 * @param {object} obj The item to check.
 * @return {boolean}
 */
export function isNavigationCommand(obj) : boolean {
  return obj && typeof obj.navigate === 'function';
}

/**
* Used during the activation lifecycle to cause a redirect.
*
* @class Redirect
* @constructor
* @param {String} url The url to redirect to.
*/
export class Redirect {
  constructor(url : string, options : Object = {}) {
    this.url = url;
    this.options = Object.assign({ trigger: true, replace: true }, options);
    this.shouldContinueProcessing = false;
  }

  /**
  * Called by the activation system to set the child router.
  *
  * @method setRouter
  * @param {Router} router
  */
  setRouter(router : Router) : void {
    this.router = router;
  }

  /**
  * Called by the navigation pipeline to navigate.
  *
  * @method navigate
  * @param {Router} appRouter - a router which should redirect
  */
  navigate(appRouter : Router) : void {
    var navigatingRouter = this.options.useAppRouter ? appRouter : (this.router || appRouter);
    navigatingRouter.navigate(this.url, this.options);
  }
}
