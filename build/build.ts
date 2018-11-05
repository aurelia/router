import rollup from 'rollup';
import { build, generateDts, IBuildTargetFormat, watchAndReBuild, copy } from './shared';
import { args } from './args';
import packageJson from '../package.json';
import { IRollupWatchOptions } from './interfaces';
import * as path from 'path';

const BASE_DIR = process.cwd();
const DIST_DIR = path.join(BASE_DIR, 'dist');
const NODE_MODULES = 'node_modules';
const LIB_NAME = 'aurelia-router';
const DIST_FILE_NAME = `${LIB_NAME}.js`;
const TYPE_DIST_FILE_NAME = `${LIB_NAME}.d.ts`;
const ENTRY_PATH = 'src/index.ts';
const EXTERNAL_LIBS = Object
  .keys({ ...packageJson.dependencies, ...packageJson.devDependencies })
  .filter(dev => /^(?:aurelia)/.test(dev) && dev !== LIB_NAME);
const configs: Record<IBuildTargetFormat, { input: string; outputs: rollup.OutputOptions[]; tsConfig?: { target: string } }> = {
  es2017: {
    input: ENTRY_PATH,
    outputs: [
      { file: `dist/es2017/${DIST_FILE_NAME}`, format: 'es' }
    ]
  },
  es2015: {
    input: ENTRY_PATH,
    outputs: [
      { file: `dist/es2015/${DIST_FILE_NAME}`, format: 'es' }
    ]
  },
  es5: {
    input: ENTRY_PATH,
    outputs: [
      { file: `dist/commonjs/${DIST_FILE_NAME}`, format: 'cjs' },
      { file: `dist/amd/${DIST_FILE_NAME}`, format: 'amd', amd: { id: LIB_NAME } },
      { file: `dist/native-modules/${DIST_FILE_NAME}`, format: 'es' }
    ]
  },
  amd: {
    input: ENTRY_PATH,
    outputs: [
      { file: `dist/amd/${DIST_FILE_NAME}`, format: 'amd', amd: { id: LIB_NAME } }
    ],
    tsConfig: {
      target: 'es5'
    }
  },
  commonjs: {
    input: ENTRY_PATH,
    outputs: [
      { file: `dist/commonjs/${DIST_FILE_NAME}`, format: 'cjs' }
    ],
    tsConfig: {
      target: 'es5'
    }
  },
  'native-modules': {
    input: ENTRY_PATH,
    outputs: [
      { file: `dist/native-modules/${DIST_FILE_NAME}`, format: 'es' }
    ],
    tsConfig: {
      target: 'es5'
    }
  }
};

if (args.dev) {
  // watch mode
  let generateDtsTO: any;
  const targetFormats: IBuildTargetFormat[] = args.format || ['commonjs'];
  const options = targetFormats.reduce((formats, targetFormat) => {
    const { outputs, tsConfig } = configs[targetFormat];
    formats[targetFormat] = {
      input: ENTRY_PATH,
      external: EXTERNAL_LIBS,
      output: outputs,
      tsConfig
    };
    return formats;
  }, {} as Record<IBuildTargetFormat, IRollupWatchOptions>);
  console.log('=============\nBuilding Started\n=============');
  watchAndReBuild(
    options,
    () => {
      console.log('=============\nFinished building\n=============');
      clearTimeout(generateDtsTO);
      generateDtsTO = setTimeout(() => {
        generateDts().then(() => {
          if (args.target) {
            copyToTargetProject(targetFormats, args.target);
          }
        });
      }, 1000);
    }
  );
} else {
  // Single build
  const targetFormats: IBuildTargetFormat[] = args.format || ['es5', 'es2015', 'es2017'];
  Promise
    .all(targetFormats.map(target => {
      const { outputs, tsConfig, ...options } = configs[target];
      return build(target, { ...options, external: EXTERNAL_LIBS }, outputs as rollup.OutputOptionsFile[]);
    }))
    .then(() => generateDts())
    .then(() => {
      if (args.target) {
        copyToTargetProject(targetFormats, args.target);
      }
    })
    .catch(ex => {
      console.log(ex);
    });
}

function copyToTargetProject(targetFormats: string[], targetProject: string) {
  console.log('=============\nCopying to target\n=============');
  targetFormats.forEach((targetFormat) => {
    copy(
      path.join(DIST_DIR, targetFormat, DIST_FILE_NAME),
      path.join(BASE_DIR, targetProject, NODE_MODULES, LIB_NAME, 'dist', targetFormat, DIST_FILE_NAME)
    );
  });
  copy(
    path.join(DIST_DIR, TYPE_DIST_FILE_NAME),
    path.join(BASE_DIR, targetProject, NODE_MODULES, LIB_NAME, 'dist', TYPE_DIST_FILE_NAME)
  );
  console.log('=============\nCopied to target\n=============');
}
