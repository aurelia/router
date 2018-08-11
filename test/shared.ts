import { Router } from '../src';
import { NavigationOptions, History } from 'aurelia-history';

export type ValueOf<T> = T[keyof T];

export interface MockRouter extends Router {
  url: string;
  route: string;
  params: Record<string, any>;
}

export class MockHistory extends History {

  activate(opt?: NavigationOptions) {
    return false;
  }
  deactivate() { }
  navigate(fragment: string, opt?: NavigationOptions): boolean {
    return false;
  }
  navigateBack() { }
  setState(key, value) { }
  getState(key) {
    return null;
  }

  getAbsoluteRoot() {
    return '';
  }

  setTitle() { }
}
