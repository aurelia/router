define(["exports"], function (exports) {
  "use strict";

  var _prototypeProperties = function (child, staticProps, instanceProps) {
    if (staticProps) Object.defineProperties(child, staticProps);
    if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
  };

  var ApplyModelBindersStep = (function () {
    var ApplyModelBindersStep = function ApplyModelBindersStep() {};

    _prototypeProperties(ApplyModelBindersStep, null, {
      run: {
        value: function (navigationContext, next) {
          return next();
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return ApplyModelBindersStep;
  })();

  exports.ApplyModelBindersStep = ApplyModelBindersStep;
});