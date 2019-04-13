import { Next } from './interfaces';
import { NavigationInstruction } from './navigation-instruction';
import { processDeactivatable, processActivatable } from './utilities-activation';
/**
 * A pipeline step responsible for finding and activating method `canDeactivate` on a view model of a route
 */
export class CanDeactivatePreviousStep {
  run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {
    return processDeactivatable(navigationInstruction, 'canDeactivate', next);
  }
}

/**
 * A pipeline step responsible for finding and activating method `canActivate` on a view model of a route
 */
export class CanActivateNextStep {
  run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {
    return processActivatable(navigationInstruction, 'canActivate', next);
  }
}

/**
 * A pipeline step responsible for finding and activating method `deactivate` on a view model of a route
 */
export class DeactivatePreviousStep {
  run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {
    return processDeactivatable(navigationInstruction, 'deactivate', next, true);
  }
}

/**
 * A pipeline step responsible for finding and activating method `activate` on a view model of a route
 */
export class ActivateNextStep {
  run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {
    return processActivatable(navigationInstruction, 'activate', next, true);
  }
}
