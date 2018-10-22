import { ViewPortInstruction, RouteConfig, ViewPort, LifecycleArguments, ViewPortPlan, ActivationStrategyType, ViewPortComponent } from './interfaces';
import { Router } from './router';
import { activationStrategy } from './navigation-plan';

export interface NavigationInstructionInit {
  fragment: string;
  queryString?: string;
  params?: Record<string, any>;
  queryParams?: Record<string, any>;
  config: RouteConfig;
  parentInstruction?: NavigationInstruction;
  previousInstruction?: NavigationInstruction;
  router: Router;
  options?: Object;
  plan?: Record<string, ViewPortInstruction>;
}

export class CommitChangesStep {
  async run(navigationInstruction: NavigationInstruction, next: Function) {
    await navigationInstruction._commitChanges(true);
    navigationInstruction._updateTitle();
    return next();
  }
}

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
  params: any;

  /**
  * Parameters extracted from the query string.
  */
  queryParams: any;

  /**
  * The route config for the route matching this instruction.
  */
  config: RouteConfig;

  /**
  * The parent instruction, if this instruction was created by a child router.
  */
  parentInstruction: NavigationInstruction;

  parentCatchHandler: any;

  /**
  * The instruction being replaced by this instruction in the current router.
  */
  previousInstruction: NavigationInstruction;

  /**
  * viewPort instructions to used activation.
  */
  viewPortInstructions: Record<string, ViewPortInstruction>;

  /**
  * The router instance.
  */
  router: Router;
  /**
  * Navigation plans for view ports
  */
  plan: Record<string, ViewPortPlan> = null;

  options: Record<string, any> = {};

  /**@internal */
  lifecycleArgs: LifecycleArguments;
  /**@internal */
  resolve?: (val?: any) => void;

  constructor(init: NavigationInstructionInit) {
    Object.assign(this, init);

    this.params = this.params || {};
    this.viewPortInstructions = {};

    let ancestorParams = [];
    let current: NavigationInstruction = this;
    do {
      let currentParams = Object.assign({}, current.params);
      if (current.config && current.config.hasChildRouter) {
        // remove the param for the injected child route segment
        delete currentParams[current.getWildCardName()];
      }

      ancestorParams.unshift(currentParams);
      current = current.parentInstruction;
    } while (current);

    let allParams = Object.assign({}, this.queryParams, ...ancestorParams);
    this.lifecycleArgs = [allParams, this.config, this];
  }

  /**
  * Gets an array containing this instruction and all child instructions for the current navigation.
  */
  getAllInstructions(): Array<NavigationInstruction> {
    let instructions: NavigationInstruction[] = [this];
    for (let key in this.viewPortInstructions) {
      let childInstruction = this.viewPortInstructions[key].childNavigationInstruction;
      if (childInstruction) {
        instructions.push(...childInstruction.getAllInstructions());
      }
    }

    return instructions;
  }

  /**
  * Gets an array containing the instruction and all child instructions for the previous navigation.
  * Previous instructions are no longer available after navigation completes.
  */
  getAllPreviousInstructions(): Array<NavigationInstruction> {
    return this.getAllInstructions().map(c => c.previousInstruction).filter(c => c);
  }

  /**
  * Adds a viewPort instruction.
  */
  addViewPortInstruction(name: string, instruction: ViewPortInstruction): ViewPortInstruction;
  addViewPortInstruction(name: string, strategy: ActivationStrategyType, moduleId: string, component: any): ViewPortInstruction;
  addViewPortInstruction(
    name: string,
    instructionOrStrategy: ViewPortInstruction | ActivationStrategyType,
    moduleId?: string,
    component?: ViewPortComponent
  ): ViewPortInstruction {
    const config: RouteConfig = Object.assign({}, this.lifecycleArgs[1], { currentViewPort: name });
    let viewportInstruction: ViewPortInstruction;
    if (typeof instructionOrStrategy === 'string') {
      viewportInstruction = this.viewPortInstructions[name] = {
        name: name,
        strategy: instructionOrStrategy,
        moduleId: moduleId,
        component: component,
        childRouter: component.childRouter,
        lifecycleArgs: [this.lifecycleArgs[0], config, this.lifecycleArgs[2]]
      };
    } else {
      viewportInstruction.name = name;
      viewportInstruction.childRouter = component.childRouter;
      viewportInstruction.lifecycleArgs = [this.lifecycleArgs[0], config, this.lifecycleArgs[2]];
    }

    return viewportInstruction;
  }

  /**
  * Gets the name of the route pattern's wildcard parameter, if applicable.
  */
  getWildCardName(): string {
    let wildcardIndex = this.config.route.lastIndexOf('*');
    return (this.config.route as string).substr(wildcardIndex + 1);
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
    let fragment = decodeURI(this.fragment);

    if (fragment === '') {
      let nonEmptyRoute = this.router.routes.find(route => {
        return route.name === this.config.name &&
          route.route !== '';
      });
      if (nonEmptyRoute) {
        fragment = nonEmptyRoute.route as any;
      }
    }

    if (!this.params) {
      return encodeURI(fragment);
    }

    let wildcardName = this.getWildCardName();
    let path = this.params[wildcardName] || '';

    if (!path) {
      return encodeURI(fragment);
    }

    return encodeURI(fragment.substr(0, fragment.lastIndexOf(path)));
  }

  /**@internal */
  _commitChanges(waitToSwap: boolean): Promise<void> {
    let router = this.router;
    router.currentInstruction = this;

    if (this.previousInstruction) {
      this.previousInstruction.config.navModel.isActive = false;
    }

    this.config.navModel.isActive = true;

    router.refreshNavigation();

    let loads: Promise<void>[] = [];
    let delaySwaps: ISwapPlan[] = [];

    for (let viewPortName in this.viewPortInstructions) {
      let viewPortInstruction = this.viewPortInstructions[viewPortName];
      let viewPort = router.viewPorts[viewPortName];

      if (!viewPort) {
        throw new Error(`There was no router-view found in the view for ${viewPortInstruction.moduleId}.`);
      }

      if (viewPortInstruction.strategy === activationStrategy.replace) {
        if (viewPortInstruction.childNavigationInstruction && viewPortInstruction.childNavigationInstruction.parentCatchHandler) {
          loads.push(viewPortInstruction.childNavigationInstruction._commitChanges(waitToSwap));
        } else {
          if (waitToSwap) {
            delaySwaps.push({ viewPort, viewPortInstruction });
          }
          loads.push(viewPort
            .process(viewPortInstruction, waitToSwap)
            .then(() => {
              if (viewPortInstruction.childNavigationInstruction) {
                return viewPortInstruction.childNavigationInstruction._commitChanges(waitToSwap);
              }
              return Promise.resolve();
            }));
        }
      } else {
        if (viewPortInstruction.childNavigationInstruction) {
          loads.push(viewPortInstruction.childNavigationInstruction._commitChanges(waitToSwap));
        }
      }
    }

    return Promise
      .all(loads)
      .then(() => {
        delaySwaps.forEach(x => x.viewPort.swap(x.viewPortInstruction));
        prune(this);
      });
  }

  /**@internal */
  _updateTitle(): void {
    let title = this._buildTitle(this.router.titleSeparator);
    if (title) {
      this.router.history.setTitle(title);
    }
  }

  /**@internal */
  _buildTitle(separator: string = ' | '): string {
    let title = '';
    let childTitles = [];

    if (this.config.navModel.title) {
      title = this.router.transformTitle(this.config.navModel.title);
    }

    for (let viewPortName in this.viewPortInstructions) {
      let viewPortInstruction = this.viewPortInstructions[viewPortName];

      if (viewPortInstruction.childNavigationInstruction) {
        let childTitle = viewPortInstruction.childNavigationInstruction._buildTitle(separator);
        if (childTitle) {
          childTitles.push(childTitle);
        }
      }
    }

    if (childTitles.length) {
      title = childTitles.join(separator) + (title ? separator : '') + title;
    }

    if (this.router.title) {
      title += (title ? separator : '') + this.router.transformTitle(this.router.title);
    }

    return title;
  }
}

function prune(instruction: NavigationInstruction) {
  instruction.previousInstruction = null;
  instruction.plan = null;
}

interface ISwapPlan {
  viewPort: ViewPort;
  viewPortInstruction: ViewPortInstruction;
}
