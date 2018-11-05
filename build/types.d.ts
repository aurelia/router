declare module 'conventional-changelog' {
  import { EventEmitter } from 'events';
  export default function (config: { preset: string }): EventEmitter;
}
