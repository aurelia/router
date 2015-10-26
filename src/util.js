export function _processPotential(obj, resolve, reject) {
  if (obj && typeof obj.then === 'function') {
    let dfd = obj.then(resolve);

    if (typeof dfd.catch === 'function') {
      return dfd.catch(reject);
    } else if (typeof dfd.fail === 'function') {
      return dfd.fail(reject);
    }

    return dfd;
  }

  try {
    return resolve(obj);
  } catch (error) {
    return reject(error);
  }
}

export function _normalizeAbsolutePath(path, hasPushState) {
  if (!hasPushState && path[0] !== '#') {
    path = '#' + path;
  }

  return path;
}

export function _createRootedPath(fragment, baseUrl, hasPushState) {
  if (isAbsoluteUrl.test(fragment)) {
    return fragment;
  }

  let path = '';

  if (baseUrl.length && baseUrl[0] !== '/') {
    path += '/';
  }

  path += baseUrl;

  if ((!path.length || path[path.length - 1] !== '/') && fragment[0] !== '/') {
    path += '/';
  }

  if (path.length && path[path.length - 1] === '/' && fragment[0] === '/') {
    path = path.substring(0, path.length - 1);
  }

  return _normalizeAbsolutePath(path + fragment, hasPushState);
}

export function _resolveUrl(fragment, baseUrl, hasPushState) {
  if (isRootedPath.test(fragment)) {
    return _normalizeAbsolutePath(fragment, hasPushState);
  }

  return _createRootedPath(fragment, baseUrl, hasPushState);
}

const isRootedPath = /^#?\//;
const isAbsoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;
