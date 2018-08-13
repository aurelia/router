const rollup = require('rollup');
const typescript = require('rollup-plugin-typescript2');

const cacheRoot = '.rollupcache';
const externalLibs = [
  'tslib',
  'aurelia-dependency-injection',
  'aurelia-event-aggregator',
  'aurelia-logging',
  'aurelia-history',
  'aurelia-route-recognizer'
];

Promise
  .all([
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
        { file: 'dist/amd/index.js', format: 'amd', amd: { id: 'aurelia-router' } },
        { file: 'dist/native-modules/index.js', format: 'es' }
      ],
      external: externalLibs,
      plugins: [
        typescript({
          useTsconfigDeclarationDir: true,
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
  }))
  .then(
    () => {
      console.log('Builded successfully. Generating dts bundle');
      const ChildProcess = require('child_process');
      ChildProcess.exec('npm run bundle-dts', (err, stdout, stderr) => {
        if (err || stderr) {
          console.log('Generating dts error:');
          console.log(stderr);
        } else {
          console.log('Generated dts bundle successfully');
          console.log(stdout);
        }
      });
    }, (err) => {
      console.log('Build failed. Reason:');
      console.log(err);
    });

