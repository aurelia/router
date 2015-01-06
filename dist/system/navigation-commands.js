System.register([], function (_export) {
  "use strict";

  var Redirect;
  _export("isNavigationCommand", isNavigationCommand);

  function isNavigationCommand(obj) {
    return obj && typeof obj.navigate === "function";
  }

  return {
    setters: [],
    execute: function () {
      Redirect = function Redirect(url) {
        this.url = url;
        this.shouldContinueProcessing = false;
      };

      Redirect.prototype.navigate = function (appRouter) {
        (this.router || appRouter).navigate(this.url, { trigger: true, replace: true });
      };

      _export("Redirect", Redirect);
    }
  };
});