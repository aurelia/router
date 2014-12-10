"use strict";

var ApplyModelBindersStep = (function () {
  var ApplyModelBindersStep = function ApplyModelBindersStep() {};

  ApplyModelBindersStep.prototype.run = function (navigationContext, next) {
    return next();
  };

  return ApplyModelBindersStep;
})();

exports.ApplyModelBindersStep = ApplyModelBindersStep;