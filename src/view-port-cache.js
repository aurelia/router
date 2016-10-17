import {transient} from 'aurelia-dependency-injection';

@transient()
export class ViewPortCache {
  controllers = {};

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
      return this.controllers[key] = controller;
    }
  }

  createKey(viewPortName, navigationInstruction): string {
    const { fragment, queryString } = navigationInstruction;
    return `ViewPort: '${viewPortName}'; Fragment: '${fragment}'; QueryString: '${queryString}';'`;
  }
}
