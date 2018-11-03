import { pipelineStatus, PipeLineStatusType } from './pipeline';
import { NavigationInstruction } from './navigation-instruction';
import { Next, StepRunnerFunction } from './interfaces';

/**@internal exported for unit testing */
export function createNext(instruction: NavigationInstruction, steps: StepRunnerFunction[]): Next {
  let index = -1;
  const next: Next = function() {
    index++;

    if (index < steps.length) {
      let currentStep = steps[index];

      try {
        return currentStep(instruction, next);
      } catch (e) {
        return next.reject(e);
      }
    } else {
      return next.complete();
    }
  } as Next;

  next.complete = createCompletionHandler(next, pipelineStatus.completed);
  next.cancel = createCompletionHandler(next, pipelineStatus.canceled);
  next.reject = createCompletionHandler(next, pipelineStatus.rejected);

  return next;
}


/**@internal exported for unit testing */
export function createCompletionHandler(next: Next, status: PipeLineStatusType) {
  return (output: any) => {
    return Promise.resolve({ status, output, completed: status === pipelineStatus.completed });
  };
}
