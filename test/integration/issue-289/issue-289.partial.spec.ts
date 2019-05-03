import { Container } from 'aurelia-dependency-injection';
import { History } from 'aurelia-history';
import { AppRouter, PipelineProvider, Router } from '../../../src/aurelia-router';
import { MockHistory } from '../../shared';

let absoluteRoot = 'http://aurelia.io/docs/';

fdescribe('the router', () => {
  let container: Container;
  let router: Router;
  let history: History;
  beforeEach(() => {
    container = new Container();
    history = new MockHistory();
    history.getAbsoluteRoot = () => absoluteRoot;
    router = new AppRouter(
      container,
      history,
      new PipelineProvider(container),
      null
    );
  });

  describe('addRoute', () => {
    it('should register named routes', async () => {
      let callCount = 0;
      const child = router.createChild();

      router.addRoute({ name: 'parent', route: 'parent', moduleId: 'parent' });
      // child.addRoute({ name: 'child', route: 'child', moduleId: 'child' });
      child.addRoute({ name: 'child2', route: 'child', navigationStrategy: instruction => {
        callCount++;
        Object.assign(instruction.config, {
          moduleId: 'hello'
        });
        debugger;
      }});
      const instruction = await child._createNavigationInstruction('/child');
      console.log(instruction);
      expect(callCount).toBe(1, 'callCount');
      debugger;
      expect(instruction.config.viewPorts.default.moduleId || instruction.config.moduleId).toBeDefined();
    });
  });
});
