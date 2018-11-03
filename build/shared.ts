import * as rollup from 'rollup';
import typescript from 'rollup-plugin-typescript2';
import rimraf from 'rimraf';
import ChildProcess from 'child_process';
import { IRollupWatchOptions } from './interfaces';
import * as fs from 'fs';
import * as path from 'path';

const CACHE_DIR = '.rollupcache';
export type IBuildTargetFormat = 'es5' | 'es2015' | 'es2017' | 'amd' | 'commonjs' | 'native-modules';

export async function build(
  target: IBuildTargetFormat,
  options: rollup.RollupFileOptions,
  outputs: rollup.OutputOptionsFile[]
): Promise<void> {
  return rollup
    .rollup({
      ...options,
      plugins: [
        typescript({
          tsconfigOverride: {
            compilerOptions: {
              target: target
            }
          },
          cacheRoot: CACHE_DIR
        }) as rollup.Plugin,
        ...(options.plugins || [])
      ]
    })
    .then(bundle => Promise.all(outputs.map(output => bundle.write(output))))
    .then(() => {
      console.log(`Built [${target}] successfully.`);
    });
}

export async function watchAndReBuild(
  options: Record<string, IRollupWatchOptions>,
  onBundleChanged: (e: any) => any
) {
  const watcher = rollup
    .watch(Object.keys(options).map(target => {
      const { plugins = [], tsConfig, ...opts } = options[target];
      return {
        ...opts,
        plugins: [
          typescript({
            tsconfigOverride: {
              compilerOptions: {
                target: tsConfig ? tsConfig.target : target
              }
            },
            cacheRoot: CACHE_DIR
          }) as rollup.Plugin,
          ...plugins
        ]
      };
    }));

  watcher.on('event', (e) => {
    if (e.code === 'ERROR') {
      console.log('Error:', e);
      return;
    }
    if (e.code === 'FATAL') {
      console.log('===============');
      console.error('FATAL:', e);
      console.log('===============');
      // rollup will exit
      return;
    }
    if (e.code === 'END') {
      onBundleChanged(e);
      return;
    }
  });
}

export async function clean(): Promise<void> {
  console.log('\n==============\nCleaning dist folder...\n==============');
  return new Promise<void>(resolve => {
    rimraf('dist', (error) => {
      if (error) {
        throw error;
      }
      resolve();
    });
  });
}

export async function generateDts(): Promise<void> {
  console.log('\n==============\nGenerating dts bundle...\n==============');
  return new Promise<void>(resolve => {
    ChildProcess.exec('npm run bundle-dts', (err, stdout, stderr) => {
      if (err || stderr) {
        console.log('Generating dts error:');
        console.log(stderr);
      } else {
        console.log('Generated dts bundle successfully');
        console.log(stdout);
      }
      resolve();
    });
  });
}

export async function copy(basePath: string, targetPath: string) {
  try {
    fs.createReadStream(basePath)
      .pipe(fs.createWriteStream(targetPath));
  } catch (ex) {
    console.log(`Error trying to copy file from "${basePath}" to "${targetPath}"`);
    console.log(ex);
  }
}
