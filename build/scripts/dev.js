// @ts-check
const args = require('../tasks/args');
const rollup = require('rollup');
/** @type {(options: import('@rollup/plugin-typescript').RollupTypescriptOptions) => import('rollup').Plugin} */
// @ts-ignore
const typescript = require('@rollup/plugin-typescript');
const ChildProcess = require('child_process');
const pkg = require('../../package.json');

const targetFormats = args.format || ['commonjs']; // by default only run devs for commonjs
const targetDir = args.target;

const LIB_NAME = pkg.name;

const buildConfigs = {
  es2015: {
    output: {
      file: `dist/es2015/${LIB_NAME}.js`,
      format: 'es'
    },
    tsConfig: {
      target: 'es2015'
    }
  },
  es2017: {
    output: {
      file: `dist/es2017/${LIB_NAME}.js`,
      format: 'es'
    },
    tsConfig: {
      target: 'es2015'
    }
  },
  amd: {
    output: {
      file: `dist/amd/${LIB_NAME}.js`,
      format: 'amd',
      amd: { id: LIB_NAME }
    },
    tsConfig: {
      target: 'es5'
    }
  },
  commonjs: {
    output: {
      file: `dist/commonjs/${LIB_NAME}.js`,
      format: 'cjs'
    },
    tsConfig: {
      target: 'es5'
    }
  },
  'native-modules': {
    output: {
      file: `dist/commonjs/${LIB_NAME}.js`,
      format: 'es'
    },
    tsConfig: {
      target: 'es5'
    }
  }
};

console.log('Running dev with targets:', targetFormats);

/**
 * @param {string} format
 */
async function roll(format) {
  const inputOptions = {
    input: 'src/aurelia-router.ts',
    external: [
      'aurelia-binding',
      'aurelia-path',
      'aurelia-templating',
      'aurelia-dependency-injection',
      'aurelia-event-aggregator',
      'aurelia-logging',
      'aurelia-history',
      'aurelia-route-recognizer'
    ],
    plugins: [
      typescript({
        target: buildConfigs[format].tsConfig.target,
        removeComments: true
      })
    ]
  };
  console.log('Starting watcher');
  const watcher = rollup
    .watch({
      ...inputOptions,
      output: buildConfigs[format].output
    });

  watcher.on('event', (e) => {
    if (e.code === 'BUNDLE_END') {
      console.log('Finished compilation. Running post task bundling dts.');
      generateDtsBundle();
    }
  });
}

function generateDtsBundle() {
  return new Promise(resolve => {
    ChildProcess.exec('npm run bundle-dts', (err, stdout, stderr) => {
      if (err || stderr) {
        console.log('Bundling dts error');
        console.log(err);
        console.log('========');
        console.log('stderr');
        console.log(stderr);
      } else {
        console.log('Generated dts bundle successfully');
      }
      resolve(err ? [null, err] : [null, null]);
    });
  });
}

targetFormats.forEach(roll);

console.log('Target directory for copy: "' + targetDir + '"');
if (targetDir) {
  console.log('Watching dist folder');
  const gulpWatch = require('gulp-watch');
  const path = require('path');
  const cwd = process.cwd();
  const destPath = path.join(cwd, targetDir, 'node_modules', 'aurelia-router');
  const fs = require('fs');
  gulpWatch('dist/**/*.*', { ignoreInitial: true }, (vinyl) => {
    if (vinyl.event !== 'unlink') {
      console.log(`change occurred at "${vinyl.path}". Copying over to specified project`);
      const subPath = vinyl.path.replace(cwd, '');
      try {
        fs.createReadStream(vinyl.path)
          .pipe(fs.createWriteStream(path.join(destPath, subPath)));
      } catch (ex) {
        console.log(`Error trying to copy file from "${vinyl.path}" to "${destPath}"`);
        console.log(ex);
      }
    }
  });
}
