import { ViewPortInstruction, RouteConfig, ViewPort, LifecycleArguments, ActivationStrategyType } from './interfaces';
import { Router } from './router';
import { activationStrategy } from './navigation-plan';

/**
 * Initialization options for a navigation instruction
 */
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
  plan?: Record<string, /*ViewPortInstruction*/any>;
}

/**
 * A pipeline step for instructing a piepline to commit changes on a navigation instruction
 */
export class CommitChangesStep {
  run(navigationInstruction: NavigationInstruction, next: Function): Promise<any> {
    return navigationInstruction
      ._commitChanges(/*wait to swap?*/true)
      .then(() => {
        navigationInstruction._updateTitle();
        return next();
      });
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
  viewPortInstructions: Record<string, /*ViewPortInstruction*/any>;

  /**
    * The router instance.
  */
  router: Router;

  /**
   * Current built viewport plan of this nav instruction
   */
  plan: Record<string, /*ViewPortPlan*/any> = null;

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
    let viewPortInstructions: Record<string, ViewPortInstruction> = this.viewPortInstructions;

    for (let key in viewPortInstructions) {
      let childInstruction = viewPortInstructions[key].childNavigationInstruction;
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
  * Adds a viewPort instruction. Returns the newly created instruction based on parameters
  */
  addViewPortInstruction(name: string, strategy: ActivationStrategyType, moduleId: string, component: any): /*ViewPortInstruction*/ any {
    const lifecycleArgs = this.lifecycleArgs;
    const config: RouteConfig = Object.assign({}, lifecycleArgs[1], { currentViewPort: name });
    const viewportInstruction = this.viewPortInstructions[name] = {
      name: name,
      strategy: strategy,
      moduleId: moduleId,
      component: component,
      childRouter: component.childRouter,
      lifecycleArgs: [].concat(lifecycleArgs[0], config, lifecycleArgs[2]) as LifecycleArguments
    };

    return viewportInstruction;
  }

  /**
  * Gets the name of the route pattern's wildcard parameter, if applicable.
  */
  getWildCardName(): string {
    // todo: potential issue, or at least unsafe typings
    let configRoute = this.config.route as string;
    let wildcardIndex = configRoute.lastIndexOf('*');
    return configRoute.substr(wildcardIndex + 1);
  }

  /**
  * Gets the path and query string created by filling the route
  * pattern's wildcard parameter with the matching param.
  */
  getWildcardPath(): string {
    let wildcardName = this.getWildCardName();
    let path = this.params[wildcardName] || '';
    let queryString = this.queryString;

    if (queryString) {
      path += '?' + queryString;
    }

    return path;
  }

  /**
  * Gets the instruction's base URL, accounting for wildcard route parameters.
  */
  getBaseUrl(): string {
    let $encodeURI = encodeURI;
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
      return $encodeURI(fragment);
    }

    let wildcardName = this.getWildCardName();
    let path = this.params[wildcardName] || '';

    if (!path) {
      return $encodeURI(fragment);
    }

    return $encodeURI(fragment.substr(0, fragment.lastIndexOf(path)));
  }

  /**@internal */
  _commitChanges(waitToSwap: boolean): Promise<void> {
    let router = this.router;
    router.currentInstruction = this;

    const previousInstruction = this.previousInstruction;
    if (previousInstruction) {
      previousInstruction.config.navModel.isActive = false;
    }

    this.config.navModel.isActive = true;

    router.refreshNavigation();

    let loads: Promise<void>[] = [];
    let delaySwaps: ISwapPlan[] = [];
    let viewPortInstructions: Record<string, ViewPortInstruction> = this.viewPortInstructions;

    for (let viewPortName in viewPortInstructions) {
      let viewPortInstruction = viewPortInstructions[viewPortName];
      let viewPort = router.viewPorts[viewPortName];

      if (!viewPort) {
        throw new Error(`There was no router-view found in the view for ${viewPortInstruction.moduleId}.`);
      }

      let child_nav_instruction = viewPortInstruction.childNavigationInstruction;
      if (viewPortInstruction.strategy === activationStrategy.replace) {
        if (child_nav_instruction && child_nav_instruction.parentCatchHandler) {
          loads.push(child_nav_instruction._commitChanges(waitToSwap));
        } else {
          if (waitToSwap) {
            delaySwaps.push({ viewPort, viewPortInstruction });
          }
          loads.push(
            viewPort
              .process(viewPortInstruction, waitToSwap)
              .then(() => child_nav_instruction
                ? child_nav_instruction._commitChanges(waitToSwap)
                : Promise.resolve()
              )
          );
        }
      } else {
        if (child_nav_instruction) {
          loads.push(child_nav_instruction._commitChanges(waitToSwap));
        }
      }
    }

    return Promise
      .all(loads)
      .then(() => {
        delaySwaps.forEach(x => x.viewPort.swap(x.viewPortInstruction));
        return null;
      })
      .then(() => prune(this));
  }

  /**@internal */
  _updateTitle(): void {
    let router = this.router;
    let title = this._buildTitle(router.titleSeparator);
    if (title) {
      router.history.setTitle(title);
    }
  }

  /**@internal */
  _buildTitle(separator: string = ' | '): string {
    let title = '';
    let childTitles = [];
    let navModelTitle = this.config.navModel.title;
    let instructionRouter = this.router;
    let viewPortInstructions: Record<string, ViewPortInstruction> = this.viewPortInstructions;

    if (navModelTitle) {
      title = instructionRouter.transformTitle(navModelTitle);
    }

    for (let viewPortName in viewPortInstructions) {
      let viewPortInstruction = viewPortInstructions[viewPortName];
      let child_nav_instruction = viewPortInstruction.childNavigationInstruction;

      if (child_nav_instruction) {
        let childTitle = child_nav_instruction._buildTitle(separator);
        if (childTitle) {
          childTitles.push(childTitle);
        }
      }
    }

    if (childTitles.length) {
      title = childTitles.join(separator) + (title ? separator : '') + title;
    }

    if (instructionRouter.title) {
      title += (title ? separator : '') + instructionRouter.transformTitle(instructionRouter.title);
    }

    return title;
  }
}

const prune = (instruction: NavigationInstruction): void => {
  instruction.previousInstruction = null;
  instruction.plan = null;
};

interface ISwapPlan {
  viewPort: ViewPort;
  viewPortInstruction: ViewPortInstruction;
}
