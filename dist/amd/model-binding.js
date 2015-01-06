define(["exports"], function (exports) {
  "use strict";

  var ApplyModelBindersStep = function ApplyModelBindersStep() {};

  ApplyModelBindersStep.prototype.run = function (navigationContext, next) {
    return next();
  };

  exports.ApplyModelBindersStep = ApplyModelBindersStep;
});