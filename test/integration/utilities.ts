import { Aurelia, PLATFORM, Controller } from 'aurelia-framework';
import { AppRouter } from '../../src/app-router';

export const bootstrapAurelia = async (root: string | Function) => {
  const baseMeta = document.createElement('base');
  baseMeta.href = location.pathname;
  document.head.prepend(baseMeta);
  const host = document.body.appendChild(document.createElement('div'));
  const aurelia = new Aurelia();
  // avoid excessive logging behavior everytime an aurelia instance starts
  const methodNames = ['log', 'warn', 'info', 'debug'];
  const fns = methodNames.map(methodName => {
    const fn = (console as Record<string, any>)[methodName];
    (console as Record<string, any>)[methodName] = PLATFORM.noop;
    return fn;
  });
  aurelia.use.standardConfiguration().developmentLogging();
  await aurelia.start();
  const appRouter = aurelia.container.get(AppRouter) as AppRouter;
  await aurelia.setRoot(
    root,
    host
  );
  // restore logging behavior back to normal
  methodNames.forEach((methodName, idx) => (console as Record<string, any>)[methodName] = fns[idx]);
  return {
    host,
    aurelia,
    appRouter,
    dispose: () => {
      const root = (aurelia as any).root as Controller;
      baseMeta.remove();
      root.unbind();
      root.detached();
      host.remove();
      appRouter.reset();
      appRouter.deactivate();
    }
  };
};
