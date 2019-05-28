import '../../setup';
import { PLATFORM } from 'aurelia-pal';
import { bootstrapAurelia, wait } from '../utilities';
import { RoutableComponentDetermineActivationStrategy } from '../../../src/interfaces';
import { App } from './app';
import { Landing } from './landing';

fdescribe('issue-639.spec.ts', () => {

  beforeEach(() => {
    // location.replace('#/');
  });

  it('should works', async () => {
    location.hash = 'none?queryTest=123';
    const { aurelia, appRouter, dispose } = await bootstrapAurelia(
      PLATFORM.moduleName('test/integration/issue-639/app')
    );

    expect(document.URL.endsWith('routePage?queryTest=123')).toBe(true, 'ends with routepage?keyword for url: ' + document.URL);

    dispose();
  });
});
