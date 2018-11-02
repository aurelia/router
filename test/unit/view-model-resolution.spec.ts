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

  describe('with "viewModel"', function _2_resolveViewModel__With_viewModel__Tests() {

    it('always invokes "viewModel"', async () => {
      for await (const viewModel of [5, 'a', null, undefined, Symbol(), {}, []]) {
        let accessed = false;
        vpInstructionOrConfig = {
          get viewModel() {
            accessed = true;
            return viewModel as any;
          }
        };
        try {
          await resolveViewModel(vpInstructionOrConfig);
          expect(1).toBe(0, 'It should not have come here.');
        } catch (ex) {
          expect(ex.toString()).toContain('not a function');
        }
        expect(accessed).toBe(true);
      }
    });

    it('resolves valid "viewModel"', async () => {
      const validViewModels = [
        null,
        class Abc { },
        function () {/**/ },
        { default: class Abc { } },
        { default: function () {/**/ } }
      ];

      // resolve valid view model
      for await (const viewModel of validViewModels) {
        let accessed = true;
        let error = 0;
        vpInstructionOrConfig = {
          viewModel: () => {
            accessed = true;
            return viewModel as any;
          }
        };
        try {
          await resolveViewModel(vpInstructionOrConfig);
        } catch (ex) {
          error = 1;
          expect(ex).toBeUndefined('It should not have happened');
        }
        expect(accessed).toBe(true);
        expect(error).toBe(0);
      }

      // resolves valid view model inside promise
      for await (const viewModel of validViewModels) {
        let accessed = true;
        let error = 0;
        vpInstructionOrConfig = {
          viewModel: () => {
            accessed = true;
            return Promise.resolve(viewModel);
          }
        };
        try {
          await resolveViewModel(vpInstructionOrConfig);
        } catch (ex) {
          error = 1;
          expect(ex).toBeUndefined('It should not have happened');
        }
        expect(accessed).toBe(true);
        expect(error).toBe(0);
      }
    });

    it('throws on invalid "viewModel"', async () => {
      const invalidViewModels: any[] = [
        undefined,
        5,
        'a',
        Symbol(),
        { Myclass: class Abc { } },
        []
      ];

      // throws on invalid view model
      for await (const viewModel of invalidViewModels) {
        let accessed = true;
        let error = 0;
        vpInstructionOrConfig = {
          viewModel: () => {
            accessed = true;
            return viewModel;
          }
        };
        try {
          await resolveViewModel(vpInstructionOrConfig);
        } catch (ex) {
          error = 1;
          expect(ex.toString()).toContain('Invalid viewModel specification');
        }
        expect(accessed).toBe(true);
        expect(error).toBe(1);
      }

      // throws on invalid view model in a promise
      for await (const viewModel of invalidViewModels) {
        let accessed = true;
        let error = 0;
        vpInstructionOrConfig = {
          viewModel: () => {
            accessed = true;
            return Promise.resolve(viewModel);
          }
        };
        try {
          await resolveViewModel(vpInstructionOrConfig);
        } catch (ex) {
          error = 1;
          expect(ex.toString()).toContain('Invalid viewModel specification');
        }
        expect(accessed).toBe(true);
        expect(error).toBe(1);
      }
    });
  });
});
