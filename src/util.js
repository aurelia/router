export function _normalizeAbsolutePath(path, usePushState, absolute = false) {
  if (!usePushState && path[0] !== '#') {
    path = '#' + path;
  }

  if (usePushState && absolute) {
    path = path.substring(1, path.length);
  }

  return path;
}

export function _createRootedPath(fragment, baseUrl, usePushState, absolute) {
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

  return _normalizeAbsolutePath(path + fragment, usePushState, absolute);
}

export function _resolveUrl(fragment, baseUrl, usePushState) {
  if (isRootedPath.test(fragment)) {
    return _normalizeAbsolutePath(fragment, usePushState);
  }

  return _createRootedPath(fragment, baseUrl, usePushState);
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
