import { Pipeline, PipelineStep, Next, pipelineStatus, NavigationInstruction } from '../../src';
import { IPipelineSlot } from '../../src/interfaces';

fdescribe('Pipeline', function Pipeline__Tests() {
  let pipeline: Pipeline;

  beforeEach(function __setup__() {
    pipeline = new Pipeline();
  });

  describe('addStep', function _1_addStep__Tests() {
    it('adds function', () => {
      const runnerFn = function(...args: any[]) { };
      pipeline.addStep(runnerFn);
      expect(pipeline.steps[0]).toBe(runnerFn);
      pipeline.addStep(runnerFn);
      expect(pipeline.steps[1]).toBe(runnerFn);
    });

    it('adds PipelineStep', async () => {
      let stepRunContext: any = {};
      const stepResult: any = {};
      const step: PipelineStep = {
        run(...args: any[]) {
          stepRunContext = this;
          return Promise.resolve(stepResult);
        }
      };
      pipeline.addStep(step);
      expect(typeof pipeline.steps[0]).toBe('function');
      expect(await pipeline.steps[0](null, null)).toBe(stepResult);
      expect(stepRunContext).toBe(step);

      stepRunContext = {};
      pipeline.addStep(step);
      expect(typeof pipeline.steps[1]).toBe('function');
      expect(await pipeline.steps[1](null, null)).toBe(stepResult);
      expect(stepRunContext).toBe(step);
    });

    it('adds IPipelineSlot', () => {
      let callCount = 0;
      const steps: (PipelineStep & { result: any })[] = [
        {
          result: {},
          run() {
            callCount++;
            return this.result;
          }
        },
        {
          result: {},
          run() {
            callCount++;
            return this.result;
          }
        },
        {
          result: {},
          run() {
            callCount++;
            return this.result;
          }
        }
      ];
      const step: IPipelineSlot = {
        getSteps() {
          return steps;
        }
      };
      const spy = spyOn(pipeline, 'addStep').and.callThrough();
      pipeline.addStep(step);
      expect(pipeline.steps.length).toBe(3);
      const [step0, step1, step2] = pipeline.steps;
      for (const stepX of [step0, step1, step2]) {
        let idx = pipeline.steps.indexOf(stepX);
        expect(typeof stepX).toBe('function');
        expect(stepX(null, null)).toBe(steps[idx].result);
      }
      expect(spy).toHaveBeenCalledTimes(4);
      expect(callCount).toBe(3);
    });
  });

  describe('run', function _2_run__Tests() {
    let navInstruction: NavigationInstruction;

    beforeEach(() => {
      navInstruction = {} as any;
    });

    // { status, output, completed: status === pipelineStatus.completed }
    it('runs to "completed" when there is no step', async () => {
      let result = await pipeline.run(navInstruction);
      expect(result.status).toBe(pipelineStatus.completed);
      expect(result.completed).toBe(true);
    });

    it('runs', async () => {
      const fragment: any = {};
      const step: PipelineStep = {
        run(nav: NavigationInstruction, next: Next): Promise<any> {
          nav.fragment = fragment;
          return next();
        }
      };
      pipeline.addStep(step);
      const result = await pipeline.run(navInstruction);
      expect(navInstruction.fragment).toBe(fragment);
      expect(result.status).toBe(pipelineStatus.completed);
      expect(result.completed).toBe(true);
    });

    describe('Errors / Rejection / Completion / Cancel', () => {
      it('completes with "rejected" status when a step throw', async () => {
        let firstCalled = 0;
        let secondCalled = 0;
        let thirdCalled = 0;
        const steps: PipelineStep[] = [
          {
            run(nav: NavigationInstruction, next: Next) {
              firstCalled = 1;
              return next();
            }
          },
          {
            run(nav: NavigationInstruction, next: Next) {
              secondCalled = 1;
              throw new Error('Invalid run.');
            }
          },
          {
            run(nav: NavigationInstruction, next: Next) {
              thirdCalled = 1;
              return next();
            }
          }
        ];
        for (const step of steps) {
          pipeline.addStep(step);
        }
        const result = await pipeline.run(navInstruction);
        expect(firstCalled).toBe(1);
        expect(secondCalled).toBe(1);
        expect(thirdCalled).toBe(0);
        expect(result.status).toBe(pipelineStatus.rejected);
      });

      it('completes with "rejected" status when a step reject', async () => {
        let firstCalled = 0;
        let secondCalled = 0;
        let thirdCalled = 0;
        const steps: PipelineStep[] = [
          {
            run(nav: NavigationInstruction, next: Next) {
              firstCalled = 1;
              return next();
            }
          },
          {
            run(nav: NavigationInstruction, next: Next) {
              secondCalled = 1;
              return next.reject(new Error('Invalid abcdef ắếốộ'));
            }
          },
          {
            run(nav: NavigationInstruction, next: Next) {
              thirdCalled = 1;
              return next();
            }
          }
        ];
        for (const step of steps) {
          pipeline.addStep(step);
        }
        const result = await pipeline.run(navInstruction);
        expect(firstCalled).toBe(1);
        expect(secondCalled).toBe(1);
        expect(thirdCalled).toBe(0);
        expect(result.status).toBe(pipelineStatus.rejected);
        expect(result.output.toString()).toContain('Invalid abcdef ắếốộ');
      });

      it('completes with "completed" status when a step invokes complete()', async () => {
        let firstCalled = 0;
        let secondCalled = 0;
        let thirdCalled = 0;
        const steps: PipelineStep[] = [
          {
            run(nav: NavigationInstruction, next: Next) {
              firstCalled = 1;
              return next.complete(new Error('Valid ắếốộắếốộắếốộ'));
            }
          },
          {
            run(nav: NavigationInstruction, next: Next) {
              secondCalled = 1;
              return next.reject(new Error('Invalid abcdef ắếốộ'));
            }
          },
          {
            run(nav: NavigationInstruction, next: Next) {
              thirdCalled = 1;
              return next();
            }
          }
        ];
        for (const step of steps) {
          pipeline.addStep(step);
        }
        const result = await pipeline.run(navInstruction);
        expect(firstCalled).toBe(1);
        expect(secondCalled).toBe(0);
        expect(thirdCalled).toBe(0);
        expect(result.status).toBe(pipelineStatus.completed);
        expect(result.output.toString()).toBe(new Error('Valid ắếốộắếốộắếốộ').toString());
      });

      it('completes with "canceled" status when a step invokes cancel()', async () => {
        let firstCalled = 0;
        let secondCalled = 0;
        let thirdCalled = 0;
        const steps: PipelineStep[] = [
          {
            run(nav: NavigationInstruction, next: Next) {
              firstCalled = 1;
              return next.cancel(new Error('Valid ắếốộắếốộắếốộ'));
            }
          },
          {
            run(nav: NavigationInstruction, next: Next) {
              secondCalled = 1;
              return next.reject(new Error('Invalid abcdef ắếốộ'));
            }
          },
          {
            run(nav: NavigationInstruction, next: Next) {
              thirdCalled = 1;
              return next();
            }
          }
        ];
        for (const step of steps) {
          pipeline.addStep(step);
        }
        const result = await pipeline.run(navInstruction);
        expect(firstCalled).toBe(1);
        expect(secondCalled).toBe(0);
        expect(thirdCalled).toBe(0);
        expect(result.status).toBe(pipelineStatus.canceled);
        expect(result.output.toString()).toBe(new Error('Valid ắếốộắếốộắếốộ').toString());
      });
    });

  });
});
