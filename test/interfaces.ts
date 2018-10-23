import 'aurelia-history';

declare module 'aurelia-history' {
  interface History {
    previousLocation: string;
  }
}
