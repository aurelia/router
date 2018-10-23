import { RouteConfig, ViewPortInstruction, ViewPortComponent, ViewPortPlan, ActivationStrategyType } from './../../src/interfaces';
import { activationStrategy } from './../../src/navigation-plan';
import { Next } from './../../src/pipeline';
import { NavigationInstruction } from './../../src/navigation-instruction';
import { LoadRouteStep, RouteLoader, Router } from '../../src';
import { determineWhatToLoad } from '../../src/route-loading';

const { replace, invokeLifecycle, noChange } = activationStrategy;

describe('determineWhatToLoad', () => {
  it('returns empty array if there is no plan', () => {
    const actual = determineWhatToLoad(<any>{});

    verifyStringifyEqual(actual, []);
  });

  it('returns empty array if the plan has no properties', () => {
    const plan: any = {};
    const actual = determineWhatToLoad(<any>{ plan });

    verifyStringifyEqual(actual, []);
  });

  it('returns the plan + instruction if activationStrategy is replace', () => {
    const instruction = <NavigationInstruction><Partial<NavigationInstruction>>{
      plan: {
        default: <ViewPortPlan>{
          strategy: replace
        }
      }
    };
    const actual = determineWhatToLoad(instruction);

    verifyStringifyEqual(actual, [
      {
        viewPortPlan: instruction.plan.default,
        navigationInstruction: instruction
      }
    ]);
  });

  it('returns the plan + instruction + childInstruction if activationStrategy is replace', () => {
    const childInstruction = <NavigationInstruction><Partial<NavigationInstruction>>{
      plan: {
        default: <ViewPortPlan>{
          strategy: replace
        }
      }
    };
    const instruction = <NavigationInstruction><Partial<NavigationInstruction>>{
      plan: {
        default: <ViewPortPlan>{
          strategy: replace,
          childNavigationInstruction: childInstruction
        }
      }
    };
    const actual = determineWhatToLoad(instruction);

    verifyStringifyEqual(actual, [
      {
        viewPortPlan: instruction.plan.default,
        navigationInstruction: instruction
      },
      {
        viewPortPlan: childInstruction.plan.default,
        navigationInstruction: childInstruction
      }
    ]);
  });

  it('calls addViewPortInstruction (and does not itself add any instructions) if prevViewModel is a string', () => {
    let addViewPortInstructionCalled = false;
    let addViewPortInstructionArgs;
    const instruction = <NavigationInstruction><Partial<NavigationInstruction>>{
      plan: {
        default: <ViewPortPlan>{
          strategy: noChange,
          prevViewModel: 'foo'
        }
      },
      addViewPortInstruction(
        name: string,
        instructionOrStrategy: ViewPortInstruction | ActivationStrategyType,
        moduleId?: string,
        component?: ViewPortComponent
      ): ViewPortInstruction {
        addViewPortInstructionCalled = true;
        addViewPortInstructionArgs = [].slice.call(arguments);
        return <ViewPortInstruction>{
          name: name,
          strategy: replace
        };
      }
    };
    const actual = determineWhatToLoad(instruction);

    verifyStringifyEqual(actual, []);
    expect(addViewPortInstructionCalled).toBe(true);
    verifyStringifyEqual(addViewPortInstructionArgs, ['default', { strategy: noChange, moduleId: 'foo' }]);
  });

  it('calls addViewPortInstruction (and does not itself add any instructions) if prevViewModel is null', () => {
    let addViewPortInstructionCalled = false;
    let addViewPortInstructionArgs;
    const instruction = <NavigationInstruction><Partial<NavigationInstruction>>{
      plan: {
        default: <ViewPortPlan>{
          strategy: noChange,
          prevViewModel: null
        }
      },
      addViewPortInstruction(
        name: string,
        instructionOrStrategy: ViewPortInstruction | ActivationStrategyType,
        moduleId?: string,
        component?: ViewPortComponent
      ): ViewPortInstruction {
        addViewPortInstructionCalled = true;
        addViewPortInstructionArgs = [].slice.call(arguments);
        return <ViewPortInstruction>{
          name: name,
          strategy: replace
        };
      }
    };
    const actual = determineWhatToLoad(instruction);

    verifyStringifyEqual(actual, []);
    expect(addViewPortInstructionCalled).toBe(true);
    verifyStringifyEqual(addViewPortInstructionArgs, ['default', { strategy: noChange, moduleId: null }]);
  });

  it('calls itself recursively if prevViewModel is null and a childInstruction is present', () => {
    const childInstruction = <NavigationInstruction><Partial<NavigationInstruction>>{
      plan: {
        default: <ViewPortPlan>{
          strategy: replace
        }
      }
    };
    let addViewPortInstructionCalled = false;
    let addViewPortInstructionArgs;
    const instruction = <NavigationInstruction><Partial<NavigationInstruction>>{
      plan: {
        default: <ViewPortPlan>{
          strategy: noChange,
          prevViewModel: null,
          childNavigationInstruction: childInstruction
        }
      },
      addViewPortInstruction(
        name: string,
        instructionOrStratsegy: ViewPortInstruction | ActivationStrategyType,
        moduleId?: string,
        component?: ViewPortComponent
      ): ViewPortInstruction {
        addViewPortInstructionCalled = true;
        addViewPortInstructionArgs = [].slice.call(arguments);
        return <ViewPortInstruction>{
          name: name,
          strategy: replace
        };
      }
    };
    const actual = determineWhatToLoad(instruction);

    verifyStringifyEqual(actual, [
      {
        viewPortPlan: childInstruction.plan.default,
        navigationInstruction: childInstruction
      }
    ]);
    expect(addViewPortInstructionCalled).toBe(true);
    verifyStringifyEqual(addViewPortInstructionArgs, ['default', { strategy: noChange, moduleId: null }]);
  });

  it('calls addViewPortInstruction (and does not itself add any instructions) if prevViewModel is a class', () => {
    class Foo { }
    let addViewPortInstructionCalled = false;
    let addViewPortInstructionArgs: [string, ViewPortInstruction];
    const instruction = <NavigationInstruction><Partial<NavigationInstruction>>{
      plan: {
        default: <ViewPortPlan>{
          strategy: noChange,
          prevViewModel: <any>Foo
        }
      },
      addViewPortInstruction(
        name: string,
        instructionOrStrategy: ViewPortInstruction | ActivationStrategyType,
        moduleId?: string,
        component?: ViewPortComponent
      ): ViewPortInstruction {
        addViewPortInstructionCalled = true;
        addViewPortInstructionArgs = [].slice.call(arguments);
        return <ViewPortInstruction>{
          name: name,
          strategy: replace
        };
      }
    };
    const actual = determineWhatToLoad(instruction);

    verifyStringifyEqual(actual, []);
    expect(addViewPortInstructionCalled).toBe(true);
    verifyStringifyEqual(addViewPortInstructionArgs, ['default', { strategy: noChange }]);
    expect(addViewPortInstructionArgs[1].viewModel()).toBe(Foo);
  });

  it('throws if no valid prevViewModel is provided', () => {
    let addViewPortInstructionCalled = false;
    const instruction = <NavigationInstruction><Partial<NavigationInstruction>>{
      plan: {
        default: <ViewPortPlan>{
          strategy: noChange
        }
      },
      addViewPortInstruction(
        name: string,
        instructionOrStrategy: ViewPortInstruction | ActivationStrategyType,
        moduleId?: string,
        component?: ViewPortComponent
      ): ViewPortInstruction {
        addViewPortInstructionCalled = true;
        return <ViewPortInstruction>{
          name: name,
          strategy: replace
        };
      }
    };

    expect(() => determineWhatToLoad(instruction)).toThrow();

    expect(addViewPortInstructionCalled).toBe(false);
  });
});


function verifyStringifyEqual(actual: any, expected: any) {
  const actualJson = JSON.stringify(actual, null, 2);
  const expectedJson = JSON.stringify(expected, null, 2);
  expect(actualJson).toEqual(expectedJson);
}
