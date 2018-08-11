import typescript from 'rollup-plugin-typescript2';

const isProduction = process.env.NODE_ENV === 'production';

export default [{
  input: 'src/index.ts',
  output: {
    file: 'dist/es2015/index.js',
    format: 'es'
  },
  external: 'tslib',
  plugins: [
    typescript({
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: {
          target: 'es2015',
          declarationDir: 'dist/types',
          importHelpers: true
        }
      },
      cacheRoot: '.rollupcache'
    })
  ]
}].concat(!isProduction
  ? []
  : [{
    input: 'src/index.ts',
    output: [
      { file: 'dist/commonjs/index.js', format: 'cjs' },
      { file: 'dist/amd/index.js', format: 'amd', amd: { id: 'aurelia-router' } },
      { file: 'dist/native-modules/index.js', format: 'es' }
    ],
    external: 'tslib',
    plugins: [
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            target: 'es5',
            declaration: false,
            declarationDir: null,
            importHelpers: true
          }
        },
        cacheRoot: '.rollupcache',
      })
    ]
  }]
);
