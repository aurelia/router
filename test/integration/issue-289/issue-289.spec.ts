import '../../setup';
import { PLATFORM } from 'aurelia-pal';
import { bootstrapAurelia } from '../utilities';

xdescribe('issue-289.spec.ts', () => {

  beforeEach(() => {
    // location.replace('#/');
  });

  it('should works', async () => {
    const { aurelia, appRouter, dispose } = await bootstrapAurelia(
      PLATFORM.moduleName('test/integration/issue-289/app')
    );
    console.log(String(location));
    await appRouter.navigate('signin-oidc');
    console.log(String(location));
    // console.log(appRouter, appRouter.navigation);
    // console.log(await appRouter._createNavigationInstruction('signin-oidc'));
    // debugger;
    dispose();
  });
});
