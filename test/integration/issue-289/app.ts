import { Router, RouterConfiguration, NavigationInstruction } from '../../../src/aurelia-router';
import { PLATFORM } from 'aurelia-framework';

export class App {
  message = 'Hello World!';

  configureRouter(config: RouterConfiguration, router: Router) {
    config.options.root = 'context.html';
    // config.options.pushState = true;
    config.title = 'Router Bug';
    config.map([
      {
        route: ['', 'home'],
        name: 'home',
        moduleId: PLATFORM.moduleName('./routes/home/home')
      },
      {
        route: 'signin-oidc',
        name: 'signin-oidc',
        moduleId: PLATFORM.moduleName('./routes/signin-oidc/signin-oidc')
      }
    ]);

    config.mapRoute({
      name: 'logInRedirectCallback',
      navigationStrategy: (instruction: NavigationInstruction) => {
        return this.signInRedirectCallback(instruction);
      },
      route: 'signin-oidc'

      // Without a module id, an exception is thrown.
      // moduleId: PLATFORM.moduleName('./routes/signin-oidc/signin-oidc')
    });
  }

  public async signInRedirectCallback(instruction: NavigationInstruction): Promise<any> {
    const callbackHandler = async () => {
      const args: any = {};
      return Promise.resolve();
    };

    const navigationInstruction = () => {
      // window.location.assign('');
      location.hash = '#/';
    };

    return this.runHandlerAndCompleteNavigationInstruction(
      callbackHandler,
      navigationInstruction);
  }


  private async runHandlerAndCompleteNavigationInstruction(
    callbackHandler: () => Promise<any>,
    navigationInstruction: () => void): Promise<any> {

    try {
      await callbackHandler();
      navigationInstruction();
    } catch (err) {
      console.error('error in runHandlerAndCompleteNavigationInstruction');
      navigationInstruction();
      throw err;
    }
  }
}
