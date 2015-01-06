"use strict";

exports.isNavigationCommand = isNavigationCommand;
function isNavigationCommand(obj) {
  return obj && typeof obj.navigate === "function";
}

var Redirect = function Redirect(url) {
  this.url = url;
  this.shouldContinueProcessing = false;
};

Redirect.prototype.navigate = function (appRouter) {
  (this.router || appRouter).navigate(this.url, { trigger: true, replace: true });
};

exports.Redirect = Redirect;