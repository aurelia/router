/**
 * A function returns true if passed parameter is of class NavigationCommand and
 * false otherwise. To define if passed parameter is NavigationCommand function
 * will check if parameter has a navigate method.
 * @param {object} obj - the item to check.
 * @return {boolean}
 */
export function isNavigationCommand(obj){
  return obj && typeof obj.navigate === 'function';
}

/**
 * This class represents a redirection command.
 */
export class Redirect{
  /**
   * @param {String} url - the url to redirect to.
   */
  constructor(url) {
    this.url = url;
    this.shouldContinueProcessing = false;
  }

  /**
   * Runs a navigation proccess.
   * @param {Router} appRouter - a router which should execute redirection.
   */
  navigate(appRouter){
    (this.router || appRouter).navigate(this.url, { trigger: true, replace: true });
  }
}
