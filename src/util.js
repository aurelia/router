export function processPotential(obj, resolve, reject) {
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

export function normalizeAbsolutePath(path, hasPushState) {
  if (!hasPushState && path[0] !== '#') {
    path = '#' + path;
  }

  return path;
}

export function createRootedPath(fragment, baseUrl, hasPushState) {
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

  return normalizeAbsolutePath(path + fragment, hasPushState);
}

export function resolveUrl(fragment, baseUrl, hasPushState) {
  if (isRootedPath.test(fragment)) {
    return normalizeAbsolutePath(fragment, hasPushState);
  }

  return createRootedPath(fragment, baseUrl, hasPushState);
}

const isRootedPath = /^#?\//;
const isAbsoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;
