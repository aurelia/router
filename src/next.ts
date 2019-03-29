import { PipelineStatus } from './pipeline-status';
import { NavigationInstruction } from './navigation-instruction';
import { Next, StepRunnerFunction, NextCompletionHandler } from './interfaces';

/**@internal exported for unit testing */
export const createNextFn = (instruction: NavigationInstruction, steps: StepRunnerFunction[]): Next => {
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

  next.complete = createCompletionHandler(next, PipelineStatus.completed);
  next.cancel = createCompletionHandler(next, PipelineStatus.canceled);
  next.reject = createCompletionHandler(next, PipelineStatus.rejected);

  return next;
};

/**@internal exported for unit testing */
export const createCompletionHandler = (next: Next, status: PipelineStatus): NextCompletionHandler => {
  return (output: any) => Promise
    .resolve({
      status,
      output,
      completed: status === PipelineStatus.completed
    });
};
