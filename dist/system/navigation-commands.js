System.register([], function (_export) {
  "use strict";

  var _prototypeProperties, Redirect;
  _export("isNavigationCommand", isNavigationCommand);

  function isNavigationCommand(obj) {
    return obj && typeof obj.navigate === "function";
  }

  return {
    setters: [],
    execute: function () {
      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      Redirect = _export("Redirect", (function () {
        function Redirect(url) {
          this.url = url;
          this.shouldContinueProcessing = false;
        }

        _prototypeProperties(Redirect, null, {
          navigate: {
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