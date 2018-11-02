import { resolveViewModel } from '../../src/resolve-view-model';
import { ViewPortInstruction, RouteConfig } from '../../src';

fdescribe('View Model resolution', function resolveViewModel__Tests() {

  let vpInstructionOrConfig: ViewPortInstruction | RouteConfig;

  describe('with "moduleId"', function _1_resolveViewModel__With_moduleId__Tests() {
    it('resolves "moduleId"', async () => {
      for await (const moduleId of [5, 'a', null, undefined, Symbol(), function () {/**/ }, {}, []]) {
        vpInstructionOrConfig = { moduleId: moduleId as any };
        expect(await resolveViewModel(vpInstructionOrConfig)).toBe(moduleId as any);
      }
    });

    it('prioritizes "moduleId" over "viewModel"', async () => {
      let count = 0;
      for await (const moduleId of [Math.random(), 'b', null, undefined, Symbol(), function () {/**/ }, {}, []]) {
        vpInstructionOrConfig = {
          moduleId: moduleId as any,
          get viewModel() {
            count++;
            return () => null as any;
          }
        };
        expect(await resolveViewModel(vpInstructionOrConfig)).toBe(moduleId as any);
      }
      expect(count).toBe(0, 'It should not have accessed "viewModel"');
    });
  });
});
