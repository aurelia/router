System.register([], function (_export) {
  "use strict";

  var ApplyModelBindersStep;
  return {
    setters: [],
    execute: function () {
      ApplyModelBindersStep = function ApplyModelBindersStep() {};

      ApplyModelBindersStep.prototype.run = function (navigationContext, next) {
        return next();
      };

      _export("ApplyModelBindersStep", ApplyModelBindersStep);
    }
  };
});