'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.processPotential = processPotential;

function processPotential(obj, resolve, reject) {
  if (obj && typeof obj.then === 'function') {
    var dfd = obj.then(resolve);

    if (typeof dfd['catch'] === 'function') {
      return dfd['catch'](reject);
    } else if (typeof dfd.fail === 'function') {
      return dfd.fail(reject);
    }

    return dfd;
  } else {
    try {
      return resolve(obj);
    } catch (error) {
      return reject(error);
    }
  }
}