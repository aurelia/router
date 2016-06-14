'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _aureliaRouter = require('./aurelia-router');

Object.keys(_aureliaRouter).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _aureliaRouter[key];
    }
  });
});