define(["exports"], function (exports) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

  var ApplyModelBindersStep = exports.ApplyModelBindersStep = (function () {
    function ApplyModelBindersStep() {}

    _prototypeProperties(ApplyModelBindersStep, null, {
      run: {
        value: function run(navigationContext, next) {
          return next();
        },
        writable: true,
        configurable: true
      }
    });

    return ApplyModelBindersStep;
  })();
  exports.__esModule = true;
});