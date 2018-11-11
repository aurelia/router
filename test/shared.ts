import { Router, Next, NavigationInstruction } from '../src';
import { NavigationOptions, History } from 'aurelia-history';

export type ValueOf<T> = T[keyof T];

export interface MockRouter extends Router {
  url: string;
  route: string;
  params: Record<string, any>;
}

export class MockHistory extends History {

  constructor(private _absoluteRoute: string = '') {
    super();
  }

  activate(opt?: NavigationOptions) {
    return false;
  }
  // tslint:disable-next-line
  deactivate() { }
  navigate(fragment: string, opt?: NavigationOptions): boolean {
    return false;
  }
  // tslint:disable-next-line
  navigateBack() { }
  // tslint:disable-next-line
  setState(key: any, value: any) { }
  getState(key: any): any {
    return null;
  }

  getAbsoluteRoot() {
    return this._absoluteRoute;
  }

  // tslint:disable-next-line
  setTitle() { }
}

export interface MockInstruction extends NavigationInstruction { }

export class MockInstruction {

  title: string;

  constructor(title: string) {
    this.title = title;
  }
  // tslint:disable-next-line
  resolve(): void { }
}


export interface MockNext extends Next {
  (): Promise<any>;
  cancel(rejection: any): any;
  result: boolean;
  rejection: boolean;
}

export interface MockPipelineState {
  next: MockNext;
  result: any;
  rejection: any;
}

export function createPipelineState() {
  let nextResult: any = null;
  let cancelResult: any = null;

  let next = (() => {
    nextResult = true;
    return Promise.resolve(nextResult);
  }) as MockNext;

  next.cancel = (rejection) => {
    cancelResult = rejection || 'cancel';
    return Promise.resolve(cancelResult);
  };

  return {
    next,
    get result() { return nextResult; },
    get rejection() { return cancelResult; }
  };
}
