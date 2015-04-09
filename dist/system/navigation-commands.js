System.register(['core-js'], function (_export) {
  var core, _classCallCheck, _createClass, Redirect;

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

      _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

      Redirect = (function () {
        function Redirect(url, options) {
          _classCallCheck(this, Redirect);

          this.url = url;
          this.options = Object.assign({ trigger: true, replace: true }, options || {});
          this.shouldContinueProcessing = false;
        }

        _createClass(Redirect, [{
          key: 'setRouter',
          value: function setRouter(router) {
            this.router = router;
          }
        }, {
          key: 'navigate',
          value: function navigate(appRouter) {
            var navigatingRouter = this.options.useAppRouter ? appRouter : this.router || appRouter;
            navigatingRouter.navigate(this.url, this.options);
          }
        }]);

        return Redirect;
      })();

      _export('Redirect', Redirect);
    }
  };
});