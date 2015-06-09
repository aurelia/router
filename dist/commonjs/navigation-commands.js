'use strict';

exports.__esModule = true;
exports.isNavigationCommand = isNavigationCommand;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _coreJs = require('core-js');

var _coreJs2 = _interopRequireDefault(_coreJs);

function isNavigationCommand(obj) {
  return obj && typeof obj.navigate === 'function';
}

var Redirect = (function () {
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

exports.Redirect = Redirect;