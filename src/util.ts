import { RouteConfig } from './interfaces';

export function _normalizeAbsolutePath(path: string, hasPushState: boolean, absolute: boolean = false) {
  if (!hasPushState && path[0] !== '#') {
    path = '#' + path;
  }

  if (hasPushState && absolute) {
    path = path.substring(1, path.length);
  }

  return path;
}

export function _createRootedPath(fragment: string, baseUrl: string, hasPushState: boolean, absolute?: boolean) {
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

  return _normalizeAbsolutePath(path + fragment, hasPushState, absolute);
}

export function _resolveUrl(fragment: string, baseUrl: string, hasPushState?: boolean) {
  if (isRootedPath.test(fragment)) {
    return _normalizeAbsolutePath(fragment, hasPushState);
  }

  return _createRootedPath(fragment, baseUrl, hasPushState);
}

export function _ensureArrayWithSingleRoutePerConfig(config: RouteConfig): RouteConfig[] {
  let routeConfigs: RouteConfig[] = [];

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
