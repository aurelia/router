import {Container} from 'aurelia-dependency-injection';
import {RouteFilterContainer, createRouteFilterStep} from '../src/route-filters';

describe('createRouteFilterStep', () => {
  it('should return a function', () => {
    let name = 'step';
    let options = { aliases: ['step2']};

    expect(typeof createRouteFilterStep(name)).toBe('function');
    expect(typeof createRouteFilterStep(name, options)).toBe('function');
  });
});

describe('createRouteFilterStep => create', () => {
  let routeFilterContainer;
  beforeEach(() => {
    routeFilterContainer = new RouteFilterContainer(new Container());
  });

  it('should return a valid object', () => {
    let name = 'step';
    let options = { aliases: ['step2']};

    expect(createRouteFilterStep(name)(routeFilterContainer)).not.toBeUndefined();
    expect(createRouteFilterStep(name, options)(routeFilterContainer)).not.toBeUndefined();
  });
});

describe('RouteFilterContainer', () => {
  let routeFilterContainer;
  beforeEach(() => {
    routeFilterContainer = new RouteFilterContainer(new Container());
  });

  xdescribe('addStep', () => {
    it('should handle addition by names and aliases', () => {
      let keys = ['preRender', 'postRender'];
//       let lookup = {
//         preRender: keys[0],
//         precommit: keys[0],
//         postRender: keys[1],
//         postcomplete: keys[1]
//       };

      routeFilterContainer.addStep('preRender', Function.prototype);
      routeFilterContainer.addStep('precommit', Function.prototype);
      expect(routeFilterContainer.filters[keys[0]].length).toEqual(2);

      routeFilterContainer.addStep('postRender', Function.prototype);
      routeFilterContainer.addStep('postcomplete', Function.prototype);
      routeFilterContainer.addStep('postRender', Function.prototype);

      expect(routeFilterContainer.filters[keys[1]].length).toEqual(3);
    });
  });

  describe('getFilterSteps', () => {
    it('should return an array of steps for a given key', () => {
      let filters = {};
      let keys = ['step1', 'step2'];
      let step = { getSteps: 'foo' };
      keys.forEach((key) => {
        filters[key] = [step, step];
      });

      routeFilterContainer.filters = filters;
      expect(routeFilterContainer.getFilterSteps(keys[0])).toEqual([step, step]);
    });
  });
});
