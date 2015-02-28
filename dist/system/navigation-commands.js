System.register([], function (_export) {
  var _prototypeProperties, _classCallCheck, Redirect;

  /**
   * Determines if the provided object is a navigation command.
   * A navigation command is anything with a navigate method.
   * @param {object} obj The item to check.
   * @return {boolean}
   */

  _export("isNavigationCommand", isNavigationCommand);

  function isNavigationCommand(obj) {
    return obj && typeof obj.navigate === "function";
  }

  return {
    setters: [],
    execute: function () {
      "use strict";

      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

      /**
      * Used during the activation lifecycle to cause a redirect.
      *
      * @class Redirect
      * @constructor
      * @param {String} url The url to redirect to.
      */
      Redirect = _export("Redirect", (function () {
        function Redirect(url) {
          _classCallCheck(this, Redirect);

          this.url = url;
          this.shouldContinueProcessing = false;
        }

        _prototypeProperties(Redirect, null, {
          navigate: {

            /**
            * Called by the navigation pipeline to navigate.
            *
            * @method navigate
            * @param {Router} appRouter - a router which should redirect
            */

            value: function navigate(appRouter) {
              (this.router || appRouter).navigate(this.url, { trigger: true, replace: true });
            },
            writable: true,
            configurable: true
          }
        });

        return Redirect;
      })());
    }
  };
});