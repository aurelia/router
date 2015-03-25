"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/**
 * Determines if the provided object is a navigation command.
 * A navigation command is anything with a navigate method.
 * @param {object} obj The item to check.
 * @return {boolean}
 */
exports.isNavigationCommand = isNavigationCommand;

function isNavigationCommand(obj) {
  return obj && typeof obj.navigate === "function";
}

/**
* Used during the activation lifecycle to cause a redirect.
*
* @class Redirect
* @constructor
* @param {String} url The url to redirect to.
*/

var Redirect = exports.Redirect = (function () {
  function Redirect(url, options) {
    _classCallCheck(this, Redirect);

    this.url = url;
    this.options = Object.assign({ trigger: true, replace: true }, options || {});
    this.shouldContinueProcessing = false;
  }

  _prototypeProperties(Redirect, null, {
    setRouter: {

      /**
      * Called by the activation system to set the child router.
      *
      * @method setRouter
      * @param {Router} router
      */

      value: function setRouter(router) {
        this.router = router;
      },
      writable: true,
      configurable: true
    },
    navigate: {

      /**
      * Called by the navigation pipeline to navigate.
      *
      * @method navigate
      * @param {Router} appRouter - a router which should redirect
      */

      value: function navigate(appRouter) {
        var navigatingRouter = this.options.useAppRouter ? appRouter : this.router || appRouter;
        navigatingRouter.navigate(this.url, this.options);
      },
      writable: true,
      configurable: true
    }
  });

  return Redirect;
})();

Object.defineProperty(exports, "__esModule", {
  value: true
});