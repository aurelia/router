import 'core-js';

/**
* Class used to represent an instruction during a navigation.
*/
export class NavigationInstruction {
  /**
  * The URL fragment.
  */
  fragment: string;

  /**
  * The query string.
  */
  queryString: string;

  /**
  * Parameters extracted from the route pattern.
  */
  params: Object;

  /**
  * Parameters extracted from the query string.
  */
  queryParams: Object;

  /**
  * The route config for the route matching this instruction.
  */
  config: Object;

  /**
  * The parent instruction, if this instruction was created by a child router.
  */
  parentInstruction: NavigationInstruction;

  /**
  * viewPort instructions to used activation.
  */
  viewPortInstructions: Object[];

  constructor(fragment: string, queryString?: string, params?: Object, queryParams?: Object, config?: Object, parentInstruction?: NavigationInstruction) {
    this.fragment = fragment;
    this.queryString = queryString;
    this.params = params || {};
    this.queryParams = queryParams;
    this.config = config;
    this.viewPortInstructions = {};
    this.parentInstruction = parentInstruction;

    let ancestorParams = [];
    let current = this;
    do {
      let currentParams = Object.assign({}, current.params);
      if (current.config && current.config.hasChildRouter) {
        // remove the param for the injected child route segment
        delete currentParams[current.getWildCardName()];
      }

      ancestorParams.unshift(currentParams);
      current = current.parentInstruction;
    } while (current);

    let allParams = Object.assign({}, queryParams, ...ancestorParams);
    this.lifecycleArgs = [allParams, config, this];
  }

  /**
  * Adds a viewPort instruction.
  */
  addViewPortInstruction(viewPortName, strategy, moduleId, component): any {
    let viewportInstruction = this.viewPortInstructions[viewPortName] = {
      name: viewPortName,
      strategy: strategy,
      moduleId: moduleId,
      component: component,
      childRouter: component.childRouter,
      lifecycleArgs: this.lifecycleArgs.slice()
    };

    return viewportInstruction;
  }

  /**
  * Gets the name of the route pattern's wildcard parameter, if applicable.
  */
  getWildCardName(): string {
    let wildcardIndex = this.config.route.lastIndexOf('*');
    return this.config.route.substr(wildcardIndex + 1);
  }

  /**
  * Gets the path and query string created by filling the route
  * pattern's wildcard parameter with the matching param.
  */
  getWildcardPath(): string {
    let wildcardName = this.getWildCardName();
    let path = this.params[wildcardName] || '';

    if (this.queryString) {
      path += '?' + this.queryString;
    }

    return path;
  }

  /**
  * Gets the instruction's base URL, accounting for wildcard route parameters.
  */
  getBaseUrl(): string {
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
