import { RouteConfig } from './interfaces';
import { NavigationInstruction } from './navigation-instruction';
import { Router } from './router';

/**
 * Abstract class that is responsible for loading view / view model from a route config
 * The default implementation can be found in `aurelia-templating-router`
 */
export class RouteLoader {
  /**
   * Load a route config based on its viewmodel / view configuration
   */
  // return typing: return typings used to be never
  // as it was a throw. Changing it to Promise<any> should not cause any issues
  loadRoute(router: Router, config: RouteConfig, navigationInstruction: NavigationInstruction): Promise</*ViewPortInstruction*/any> {
    throw new Error('Route loaders must implement "loadRoute(router, config, navigationInstruction)".');
  }
}
