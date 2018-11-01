const rollup = require('rollup');
const typescript = require('rollup-plugin-typescript2');
const rimraf = require('rimraf');

const LIB_NAME = 'aurelia-router';
const cacheRoot = '.rollupcache';
const externalLibs = [
  'aurelia-dependency-injection',
  'aurelia-event-aggregator',
  'aurelia-logging',
  'aurelia-history',
  'aurelia-route-recognizer'
];

clean().then(build).then(generateDts);

/**
 * @type {() => Promise<Error | null>}
 */
function clean() {
  console.log('\n==============\nCleaning dist folder...\n==============');
  return new Promise(resolve => {
    rimraf('dist', (error) => {
      if (error) {
        throw error;
      }
      resolve();
    });
  });
}

function generateDts() {
  console.log('\n==============\nGenerating dts bundle...\n==============');
  return new Promise(resolve => {
    const ChildProcess = require('child_process');
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
};

function build() {
  console.log('\n==============\nBuidling...\n==============');
  return Promise.all([
    {
      input: 'src/index.ts',
      output: [
        { file: 'dist/es2015/index.js', format: 'es' }
      ],
      external: externalLibs,
      plugins: [
        typescript({
          tsconfigOverride: {
            compilerOptions: {
              target: 'es2015'
            }
          },
          cacheRoot: cacheRoot
        }),
      ]
    },
    {
      input: 'src/index.ts',
      output: [
        { file: 'dist/commonjs/index.js', format: 'cjs' },
        { file: 'dist/amd/index.js', format: 'amd', amd: { id: LIB_NAME } },
        { file: 'dist/native-modules/index.js', format: 'es' }
      ],
      external: externalLibs,
      plugins: [
        typescript({
          tsconfigOverride: {
            compilerOptions: {
              target: 'es5'
            }
          },
          cacheRoot: cacheRoot
        }),
      ]
    }
  ].map(cfg => {
    return rollup
      .rollup(cfg)
      .then(bundle => Promise.all(cfg.output.map(o => bundle.write(o))));
  }));
};
