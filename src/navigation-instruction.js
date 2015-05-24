import core from 'core-js';

export class NavigationInstruction {
  constructor(fragment, queryString, params, queryParams, config, parentInstruction) {
    const allParams = Object.assign({}, queryParams, params);

    this.fragment = fragment;
    this.queryString = queryString;
    this.params = params || {};
    this.queryParams = queryParams;
    this.config = config;
    this.lifecycleArgs = [allParams, config, this];
    this.viewPortInstructions = {};

    if (parentInstruction) {
      this.params.$parent = parentInstruction.params;
    }
  }

  addViewPortInstruction(viewPortName, strategy, moduleId, component) {
    return this.viewPortInstructions[viewPortName] = {
      name: viewPortName,
      strategy: strategy,
      moduleId: moduleId,
      component: component,
      childRouter: component.childRouter,
      lifecycleArgs: this.lifecycleArgs.slice()
    };
  }

  getWildCardName() {
    let wildcardIndex = this.config.route.lastIndexOf('*');
    return this.config.route.substr(wildcardIndex + 1);
  }

  getWildcardPath() {
    let wildcardName = this.getWildCardName();
    let path = this.params[wildcardName] || '';

    if (this.queryString) {
      path += '?' + this.queryString;
    }

    return path;
  }

  getBaseUrl() {
    if (!this.params) {
      return this.fragment;
    }

    let wildcardName = this.getWildCardName();
    let path = this.params[wildcardName] || '';

    if (!path) {
      return this.fragment;
    }

    return this.fragment.substr(0, this.fragment.lastIndexOf(path));
  }
}
