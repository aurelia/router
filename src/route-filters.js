import {Container} from 'aurelia-dependency-injection';

export class RouteFilterContainer {
  static inject() {return [Container];}
  constructor(container : Container) {
    this.container = container;
    this.filters = { };
    this.filterCache = { };
  }

  addStep(name : string, step : any, index : number = -1) : void {
    let filter = this.filters[name];
    if (!filter) {
      filter = this.filters[name] = [];
    }

    if (index === -1) {
      index = filter.length;
    }

    filter.splice(index, 0, step);
    this.filterCache = {};
  }

  getFilterSteps(name : string) {
    if (this.filterCache[name]) {
      return this.filterCache[name];
    }

    let steps = [];
    let filter = this.filters[name];
    if (!filter) {
      return steps;
    }

    for (let i = 0, l = filter.length; i < l; i++) {
      if (typeof filter[i] === 'string') {
        steps.push(...this.getFilterSteps(filter[i]));
      } else {
        steps.push(this.container.get(filter[i]));
      }
    }

    return this.filterCache[name] = steps;
  }
}

export function createRouteFilterStep(name : string) : Function {
  function create(routeFilterContainer) {
    return new RouteFilterStep(name, routeFilterContainer);
  };
  create.inject = function() {
    return [RouteFilterContainer];
  };
  return create;
}

class RouteFilterStep {
  isMultiStep: boolean = true;

  constructor(name : string, routeFilterContainer : RouteFilterContainer) {
    this.name = name;
    this.routeFilterContainer = routeFilterContainer;
  }

  getSteps() {
    return this.routeFilterContainer.getFilterSteps(this.name);
  }
}
