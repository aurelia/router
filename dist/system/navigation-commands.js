System.register(['core-js'], function (_export) {
  var core, _classCallCheck, Redirect;

  _export('isNavigationCommand', isNavigationCommand);

  function isNavigationCommand(obj) {
    return obj && typeof obj.navigate === 'function';
  }

  return {
    setters: [function (_coreJs) {
      core = _coreJs['default'];
    }],
    execute: function () {
      'use strict';

      _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

      Redirect = (function () {
        function Redirect(url, options) {
          _classCallCheck(this, Redirect);

          this.url = url;
          this.options = Object.assign({ trigger: true, replace: true }, options || {});
          this.shouldContinueProcessing = false;
        }

        Redirect.prototype.setRouter = function setRouter(router) {
          this.router = router;
        };

        Redirect.prototype.navigate = function navigate(appRouter) {
          var navigatingRouter = this.options.useAppRouter ? appRouter : this.router || appRouter;
          navigatingRouter.navigate(this.url, this.options);
        };

        return Redirect;
      })();

      _export('Redirect', Redirect);
    }
  };
});