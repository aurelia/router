import * as yargs from 'yargs';
import { IBuildTargetFormat } from './shared';

export interface IArguments {
  target: string;
  format: IBuildTargetFormat[];
  dev: boolean;
}

export const args: IArguments = yargs
  .options(
    'target',
    {
      alias: 't',
      // tslint:disable-next-line:max-line-length
      description: 'target module dir to copy build results into (eg. "--target ../other-module" to copy build results into "../other-module/node_modules/this-module/dist/…" whenever they change)'
    }
  )
  .options('format', {
    alias: 'f',
    array: true,
    description: 'format to compile to (eg. "es2015", "commonjs", …). Can be set muliple times to compile to multiple formats. Default is all formats.'
  })
  .options('dev', {
    alias: 'd',
    boolean: true,
    description: 'Enable dev move to watch for change and copy dist over target folder'
  })
  .argv as any;
