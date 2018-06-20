export function _normalizeAbsolutePath(path, hasPushState, root) {
  if (!hasPushState && path[0] !== '#') {
    path = '#' + path;
  }

  if (hasPushState && root) {
    path = root + path.substring(1, path.length);
  }

  return path;
}

export function _createRootedPath(fragment, baseUrl, hasPushState, root) {
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

  return _normalizeAbsolutePath(path + fragment, hasPushState, root);
}

export function _resolveUrl(fragment, baseUrl, hasPushState, root) {
  if (isRootedPath.test(fragment)) {
    return _normalizeAbsolutePath(fragment, hasPushState, root);
  }

  return _createRootedPath(fragment, baseUrl, hasPushState, root);
}

export function _ensureArrayWithSingleRoutePerConfig(config) {
  let routeConfigs = [];

  if (Array.isArray(config.route)) {
    for (let i = 0, ii = config.route.length; i < ii; ++i) {
      let current = Object.assign({}, config);
      current.route = config.route[i];
      routeConfigs.push(current);
    }
  } else {
    routeConfigs.push(Object.assign({}, config));
  }

  return routeConfigs;
}

const isRootedPath = /^#?\//;
const isAbsoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;
