import { NavigationInstruction } from './navigation-instruction';

/**
 * A pipeline step for instructing a piepline to commit changes on a navigation instruction
 */
export class CommitChangesStep {
  run(navigationInstruction: NavigationInstruction, next: Function): Promise<any> {
    return navigationInstruction
      ._commitChanges(/*wait to swap?*/ true)
      .then(() => {
        navigationInstruction._updateTitle();
        return next();
      });
  }
}
