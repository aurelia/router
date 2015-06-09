"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NavModel = (function () {
  function NavModel(router, relativeHref) {
    _classCallCheck(this, NavModel);

    this.router = router;
    this.relativeHref = relativeHref;

    this.isActive = false;

    this.title = null;

    this.href = null;

    this.settings = {};

    this.config = null;
  }

  NavModel.prototype.setTitle = function setTitle(title) {
    this.title = title;

    if (this.isActive) {
      this.router.updateTitle();
    }
  };

  return NavModel;
})();

exports.NavModel = NavModel;