import { Aurelia, PLATFORM, Controller, LogManager } from 'aurelia-framework';
import { ConsoleAppender } from 'aurelia-logging-console';
import { AppRouter } from '../../src/app-router';

/**
 * A bootstrapper utility to bootstrap an aurelia application for integration testing
 *
 * Handles all preparation and disposing steps for tests
 */
export const bootstrapAurelia = async <T extends object = object>(root: string | Function) => {
  const baseMeta = document.createElement('base');
  baseMeta.href = location.pathname;
  document.head.prepend(baseMeta);
  const host = document.body.appendChild(document.createElement('div'));
  const aurelia = new Aurelia();
  const loggerImpl = new ConsoleAppender();
  aurelia
    .use
    .standardConfiguration();
    // avoid excessive logging behavior everytime an aurelia instance starts
    // .developmentLogging();
  let appRouter: AppRouter;
  const disposeFn = () => {
    try {
      const root = (aurelia as any).root as Controller;
      LogManager.removeAppender(loggerImpl);
      baseMeta.remove();
      root.unbind();
      root.detached();
      host.remove();
      appRouter.reset();
      appRouter.deactivate();
    } catch {
      // empty
    }
  };

  try {
    await aurelia.start();
    appRouter = aurelia.container.get(AppRouter) as AppRouter;
    await aurelia.setRoot(
      root,
      host
    );
  } catch (ex) {
    console.log('Test bootstrapping error');
    console.error(ex);
    disposeFn();
    throw ex;
  }
  LogManager.addAppender(loggerImpl);

  return {
    host,
    aurelia,
    appRouter,
    viewModel: ((aurelia as any).root as Controller).viewModel as T,
    dispose: disposeFn
  };
};

export const setDocumentBaseUrl = (url: string) => {
  // remove all existing base tag
  document.head.querySelectorAll('base').forEach(b => b.remove());
  // add new base tag
  document.head.appendChild(document.createElement('base')).href = url;
};

export const wait = (time: number) => new Promise(r => setTimeout(r, time));
