System.register([], function (_export) {
  "use strict";

  var _prototypeProperties, ApplyModelBindersStep;
  return {
    setters: [],
    execute: function () {
      _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

      ApplyModelBindersStep = _export("ApplyModelBindersStep", (function () {
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
      })());
    }
  };
});