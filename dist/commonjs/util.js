'use strict';

exports.__esModule = true;
exports.processPotential = processPotential;
exports.normalizeAbsolutePath = normalizeAbsolutePath;
exports.createRootedPath = createRootedPath;
exports.resolveUrl = resolveUrl;

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

function normalizeAbsolutePath(path, hasPushState) {
  if (!hasPushState && path[0] !== '#') {
    path = '#' + path;
  }

  return path;
}

function createRootedPath(fragment, baseUrl, hasPushState) {
  if (isAbsoluteUrl.test(fragment)) {
    return fragment;
  }

  var path = '';

  if (baseUrl.length && baseUrl[0] !== '/') {
    path += '/';
  }

  path += baseUrl;

  if ((!path.length || path[path.length - 1] != '/') && fragment[0] != '/') {
    path += '/';
  }

  if (path.length && path[path.length - 1] == '/' && fragment[0] == '/') {
    path = path.substring(0, path.length - 1);
  }

  return normalizeAbsolutePath(path + fragment, hasPushState);
}

function resolveUrl(fragment, baseUrl, hasPushState) {
  if (isRootedPath.test(fragment)) {
    return normalizeAbsolutePath(fragment, hasPushState);
  } else {
    return createRootedPath(fragment, baseUrl, hasPushState);
  }
}

var isRootedPath = /^#?\//;
var isAbsoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;