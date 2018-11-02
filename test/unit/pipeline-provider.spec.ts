import { Container } from 'aurelia-dependency-injection';
import { SlottableStep, PipelineProvider, PipelineSlot } from '../../src/pipeline-provider';
import { Pipeline, CanDeactivatePreviousStep } from '../../src';

fdescribe('PipelineProvider', function PipelineProvider__Tests() {
  let container: Container;
  let pipelineProvider: PipelineProvider;
  let slottableSteps = [
    SlottableStep.authorize,
    SlottableStep.preActivate,
    SlottableStep.preRender,
    SlottableStep.postRender,
    SlottableStep.preActivate__or__modelbind,
    SlottableStep.preRender__or__precommit,
    SlottableStep.postRender__or__postcomplete
  ];

  beforeEach(function __setup__() {
    container = new Container();
    pipelineProvider = container.get(PipelineProvider);
  });

  it('_buildSteps', function _1__buildSteps__Tests() {
    expect(Array.isArray(pipelineProvider.steps)).toBe(true);
  });

  describe('_findStep', function _2__findStep__Tests() {
    it('finds slot for registered name', () => {
      for (const slotName of slottableSteps) {
        const slot = pipelineProvider._findStep(slotName);
        expect(slot instanceof PipelineSlot).toBe(true);
      }
    });

    it('returns undefined for unregistered name', () => {
      const invalidSlotNames: any[] = [null, undefined, '1', 5, Symbol(), function () { }, {}, []];
      for (const slotName of invalidSlotNames) {
        expect(pipelineProvider._findStep(slotName)).toBeUndefined();
      }
    });
  });

  describe('addStep', function _3_addStep__Tests() {
    it('adds step for standard step name', () => {
      for (const stepSlotName of slottableSteps) {
        for (const step of [function () { }, {} as any]) {
          expect(() => pipelineProvider.addStep(stepSlotName, step)).not.toThrow();
        }
      }
    });

    it('throws when adding unregistered slot', () => {
      const invalidSlotNames: any[] = [null, undefined, '1', 5, function () { }, {}, []];
      for (const slotName of invalidSlotNames) {
        expect(() => pipelineProvider.addStep(slotName, class { })).toThrowError(/Invalid pipeline slot name:/);
      }
    });

    it('does not add same step twice for the same slot name', () => {
      const slots = [
        SlottableStep.authorize,
        SlottableStep.preActivate,
        SlottableStep.preRender,
        SlottableStep.postRender
      ];
      for (const stepSlotName of slots) {
        for (const step of [function () { }, {} as any]) {
          container = new Container();
          pipelineProvider = container.get(PipelineProvider);
          const stepSlotSteps = pipelineProvider._findStep(stepSlotName).steps;
          pipelineProvider.addStep(stepSlotName, step);
          expect(stepSlotSteps.length).toBe(1);
          expect(stepSlotSteps[0]).toBe(step);
          pipelineProvider.addStep(stepSlotName, step);
          expect(stepSlotSteps.length).toBe(1);
          expect(stepSlotSteps[0]).toBe(step);
        }
      }
    });
  });

  describe('removeStep', function _4_removeStep__Tests() {
    it('removes', () => {
      const slots = [
        SlottableStep.authorize,
        SlottableStep.preActivate,
        SlottableStep.preRender,
        SlottableStep.postRender
      ];
      for (const stepSlotName of slots) {
        for (const step of [function () { }, {} as any]) {
          const stepSlotSteps = pipelineProvider._findStep(stepSlotName).steps;
          stepSlotSteps.push(step);
          pipelineProvider.removeStep(stepSlotName, step);
          expect(stepSlotSteps.length).toBe(0);
        }
      }
    });

    it('does nothing for unregistered slot', () => {
      const invalidSlotNames: any[] = [null, undefined, '1', 5, Symbol(), function () { }, {}, []];
      for (const stepSlotName of invalidSlotNames) {
        expect(() => pipelineProvider.removeStep(stepSlotName, {} as any)).not.toThrow();
      }
    });
  });

  describe('_clearStep', function _5__clearStep__Tests() {
    it('clears', () => {
      for (const slotName of slottableSteps) {
        let stepSlotSteps1 = pipelineProvider._findStep(slotName).steps;
        pipelineProvider._clearSteps(slotName);
        let stepSlotSteps2 = pipelineProvider._findStep(slotName).steps;
        expect(stepSlotSteps1).not.toBe(stepSlotSteps2);
        expect(Array.isArray(stepSlotSteps2)).toBe(true);
        expect(stepSlotSteps2.length).toBe(0);
      }
    });

    it('does nothing for unregistered slot', () => {
      const invalidSlotNames: any[] = [null, undefined, '1', 5, Symbol(), function () { }, {}, []];
      for (const stepSlotName of invalidSlotNames) {
        expect(() => pipelineProvider._clearSteps(stepSlotName)).not.toThrow();
      }
    });
  });

  describe('createPipeLine', function _6_createPipeLine__Tests() {
    const slots = [
      SlottableStep.authorize,
      SlottableStep.preActivate,
      SlottableStep.preRender,
      SlottableStep.postRender
    ];

    it('creates', () => {
      let pipeline: Pipeline;
      expect(() => pipeline = pipelineProvider.createPipeline()).not.toThrow();
      expect(pipeline instanceof Pipeline).toBe(true);

      let expectedLength = getProviderStepCount(pipelineProvider);
      expect(pipeline.steps.length).toBe(expectedLength);

      for (const stepSlotName of slots) {
        pipelineProvider._findStep(stepSlotName).steps.push({ run() { } } as any);
      }
      expectedLength = expectedLength + slots.length;
      expect(() => pipeline = pipelineProvider.createPipeline()).not.toThrow();
      expect(pipeline.steps.length).toBe(expectedLength);
    });

    it('creates without CanDeactivateStep step', () => {
      let pipeline: Pipeline;
      expect(() => pipeline = pipelineProvider.createPipeline(false)).not.toThrow();
      expect(pipeline instanceof Pipeline).toBe(true);

      let expectedLength = getProviderStepCount(pipelineProvider, false);
      expect(pipeline.steps.length).toBe(expectedLength);

      for (const stepSlotName of slots) {
        pipelineProvider._findStep(stepSlotName).steps.push({ run() { } } as any);
      }
      expectedLength = expectedLength + slots.length;
      expect(() => pipeline = pipelineProvider.createPipeline(false)).not.toThrow();
      expect(pipeline.steps.length).toBe(expectedLength);
    });

    function getProviderStepCount(provider: PipelineProvider, useCanDeactivate: boolean = true) {
      return provider.steps.reduce((count, step) => {
        if (typeof step === 'function') {
          if (useCanDeactivate) {
            return count + 1;
          } else {
            return count + (step !== CanDeactivatePreviousStep ? 1 : 0);
          }
        }
        return count + step.steps.length;
      }, 0);
    }
  });

  it('resets', function _7_reset__Tests() {
    for (const slotName of slottableSteps) {
      let stepSlotSteps = pipelineProvider._findStep(slotName).steps;
      const step = {} as any;
      expect(stepSlotSteps.length).toBe(0);
      pipelineProvider.addStep(slotName, step);
      expect(stepSlotSteps.length).toBe(1);
      expect(stepSlotSteps[0]).toBe(step);
      pipelineProvider.reset();
      expect(stepSlotSteps.length).toBe(1);
      stepSlotSteps = pipelineProvider._findStep(slotName).steps;
      expect(stepSlotSteps.length).toBe(0);
    }
  });

  describe('PipelineSlot', function _8_PipelineSlot__Tests() {
    let pipelineSlot: PipelineSlot;

    beforeEach(() => {
      pipelineSlot = new PipelineSlot(container, '');
    });

    it('returns no steps when there is nothing to map', () => {
      const steps = pipelineSlot.getSteps();
      expect(steps.length).toBe(0);
    });

    it('uses container to map steps', () => {
      const step = {};
      const stepKeyValuePairs: any[] = [
        [5, step],
        ['a', step],
        [Symbol(), step],
        [{}, step],
        [[], step],
        [function () { }, step]
      ];

      const spy = spyOn(container, 'get').and.callThrough();

      for (const [key, value] of stepKeyValuePairs) {
        container.registerInstance(key, value);
        pipelineSlot.steps.push(key);
      }

      const slotSteps = pipelineSlot.getSteps();
      expect(spy).toHaveBeenCalledTimes(stepKeyValuePairs.length);
      expect(slotSteps.length).toBe(stepKeyValuePairs.length);
      expect(slotSteps.every(s => s === step)).toBe(true);
    });
  });
});
