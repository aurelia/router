import {Container} from 'aurelia-dependency-injection';

const lookup = {};

export class RouteFilterContainer {
  static inject() { return [Container]; }

  constructor(container: Container) {
    this.container = container;
    this.filters = { };
    this.filterCache = { };
  }

  addStep(name: string, step: any, index: number = -1): void {
    let key = lookup[name];
    let filter = this.filters[key];
    if (!filter) {
      filter = this.filters[key] = [];
    }

    if (index === -1) {
      index = filter.length;
    }

    filter.splice(index, 0, step);
    this.filterCache = {};
  }

  getFilterSteps(key: string) {
    if (this.filterCache[key]) {
      return this.filterCache[key];
    }

    let steps = [];
    let filter = this.filters[key];
    if (!filter) {
      return steps;
    }

    for (let i = 0, l = filter.length; i < l; i++) {
      if (typeof filter[i] === 'string') {
        steps.push(...this.getFilterSteps(lookup[filter[i]]));
      } else {
        steps.push(this.container.get(filter[i]));
      }
    }

    this.filterCache[key] = steps;
    return steps;
  }
}

export function createRouteFilterStep(name: string, options?: any = {}): Function {
  options = Object.assign({}, { aliases: [] }, options);

  lookup[name] = name;
  options.aliases.forEach((alias) => {
    lookup[alias] = name;
  });

  function create(routeFilterContainer) {
    let key = name;
    return new RouteFilterStep(key, routeFilterContainer);
  }

  create.inject = function() {
    return [RouteFilterContainer];
  };

  return create;
}

class RouteFilterStep {
  isMultiStep: boolean = true;

  constructor(key: string, routeFilterContainer: RouteFilterContainer) {
    this.key = key;
    this.routeFilterContainer = routeFilterContainer;
  }

  getSteps() {
    return this.routeFilterContainer.getFilterSteps(this.key);
  }
}
