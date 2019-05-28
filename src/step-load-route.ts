import { Next } from './interfaces';
import { NavigationInstruction } from './navigation-instruction';
import { loadNewRoute } from './utilities-route-loading';
import { RouteLoader } from './route-loader';

/**
 * A pipeline step responsible for loading a route config of a navigation instruction
 */
export class LoadRouteStep {
  /**@internal */
  static inject() { return [RouteLoader]; }
  /**
   * Route loader isntance that will handle loading route config
   * @internal
   */
  routeLoader: RouteLoader;
  constructor(routeLoader: RouteLoader) {
    this.routeLoader = routeLoader;
  }
  /**
   * Run the internal to load route config of a navigation instruction to prepare for next steps in the pipeline
   */
  run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {
    return loadNewRoute(this.routeLoader, navigationInstruction)
      .then(next, next.cancel);
  }
}
