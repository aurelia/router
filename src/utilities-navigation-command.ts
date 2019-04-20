import { Router } from './router';

/**@internal */
declare module 'aurelia-history' {
  interface NavigationOptions {
    useAppRouter?: boolean;
  }
}

/**
 * When a navigation command is encountered, the current navigation
 * will be cancelled and control will be passed to the navigation
 * command so it can determine the correct action.
 */
export interface NavigationCommand {
  navigate: (router: Router) => void;
  /**@internal */
  shouldContinueProcessing?: boolean;
  /**@internal */
  setRouter?: (router: Router) => void;
}

/**
 * Determines if the provided object is a navigation command.
 * A navigation command is anything with a navigate method.
 *
 * @param obj The object to check.
 */
export function isNavigationCommand(obj: any): obj is NavigationCommand {
  return obj && typeof obj.navigate === 'function';
}
