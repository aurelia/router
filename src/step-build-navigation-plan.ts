import { Next } from './interfaces';
import { Redirect } from './redirect';
import { NavigationInstruction } from './navigation-instruction';
import { _buildNavigationPlan } from './navigation-plan';

/**
 * Transform a navigation instruction into viewport plan record object,
 * or a redirect request if user viewmodel demands
 */
export class BuildNavigationPlanStep {
  run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {
    return _buildNavigationPlan(navigationInstruction)
      .then(redirectOrViewPortPlans => {
        if (redirectOrViewPortPlans instanceof Redirect) {
          return next.cancel(redirectOrViewPortPlans);
        }
        navigationInstruction.plan = redirectOrViewPortPlans;
        return next();
      })
      .catch(next.cancel);
  }
}
