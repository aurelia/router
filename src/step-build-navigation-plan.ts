import { Next } from './interfaces';
import { Redirect } from './navigation-commands';
import { NavigationInstruction } from './navigation-instruction';
import { _buildNavigationPlan } from './navigation-plan';

/**
 * Transform a navigation instruction into viewport plan record object,
 * or a redirect request if user viewmodel demands
 */
export class BuildNavigationPlanStep {
  run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {
    return _buildNavigationPlan(navigationInstruction)
      .then(plan => {
        if (plan instanceof Redirect) {
          return next.cancel(plan);
        }
        navigationInstruction.plan = plan;
        return next();
      })
      .catch(next.cancel);
  }
}
