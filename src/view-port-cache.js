import {transient} from 'aurelia-dependency-injection';

@transient()
export class ViewPortCache {
  controllers = Object.create(null);

  get(viewPortName, viewPortConfig, navigationInstruction) {
    if (viewPortConfig.cacheable) {
      const key = this.createKey(viewPortName, navigationInstruction);
      return this.controllers[key] || null;
    }
    return null;
  }

  set(viewPortName, viewPortConfig, navigationInstruction, controller) {
    if (viewPortConfig.cacheable) {
      const key = this.createKey(viewPortName, navigationInstruction);
      this.controllers[key] = controller;
      return true;
    }
    return false;
  }

  clear() {
    controllers = this.controllers;
    this.controllers = Object.create(null);
    for (let key in controllers) {
      if (controllers.hasOwnProperty(key)) {
        controllers[key].unbind();
      }
    }
  }

  createKey(viewPortName, navigationInstruction): string {
    const { fragment, queryString } = navigationInstruction;
    return `ViewPort: '${viewPortName}'; Fragment: '${fragment}'; QueryString: '${queryString}';'`;
  }
}
