const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const tools = require('aurelia-tools');
const glob = require('glob');
const paths = require('../paths');
const args = require('./args');
const watch = require('gulp-watch');
const runSequence = require('run-sequence');
const compileToModules = args.format || ['es2015', 'commonjs', 'amd', 'system', 'native-modules'];
// const gulpCopy = require('gulp-copy');

gulp.task('update-own-deps', function(){
  tools.updateOwnDependenciesFromLocalRepositories();
});

gulp.task('build-dev-env', function () {
  tools.buildDevEnv();
});

gulp.task('dev', ['build'], (callback) => {
  let rebuildTO;
  watch(paths.source, () => {
    // gulp.start('build');
    clearTimeout(rebuildTO);
    rebuildTO = setTimeout(() => {
      runSequence(
        'build-index',
        compileToModules
          .map(function(moduleType) { return 'build-babel-' + moduleType })
          .concat(paths.useTypeScriptForDTS ? ['build-dts'] : []),
        
      );
    }, 50);
  });
  // gulp.watch(paths.files, ['build']);
   if (args.target) {
    const projectName = require('../../package.json').name;
    const targetNPMPath = path.join(args.target, 'node_modules', projectName);
    fs.stat(targetNPMPath, (err, stats) => {
      console.log(err, stats.isDirectory());
      if (!err && stats.isDirectory()) {
        const targetNPMDistPath = path.join(targetNPMPath, paths.output);
        watchAndCopy(paths.output, targetNPMDistPath);
      }
    });
    const targetJSPMGlob = path.join(args.target, 'jspm_packages', 'npm', projectName + '@*/');
    glob(targetJSPMGlob, (err, files) => {
      if (!err && files.length === 1) {
        const targetJSPMPath = files[0];
        const amdPath = path.join(paths.output, 'amd');
        watchAndCopy(amdPath, targetJSPMPath);
      }
    });
  }
});
function watchAndCopy(basePath, targetPath) {
  const filnalPath = path.join(basePath, '**', '*');
  // console.log('Watching:', filnalPath);
  watch(filnalPath, vinyl => {
    // console.log('dist in source changed', vinyl.event);
    if (vinyl.event === 'unlink') {
      return;
    }
    // console.log('Path changed:', vinyl.path);
    const relativePath = path.relative(basePath, vinyl.path);
    const destPath = path.join(targetPath, relativePath);
    fs.createReadStream(vinyl.path).pipe(fs.createWriteStream(destPath));
  });
  // gulp.watch(path.join(basePath, '**', '*'), (event) => {
  //   if (event.type === 'deleted') {
  //     return;
  //   }
  //    const relativePath = path.relative(basePath, event.path);
  //   const destPath = path.join(targetPath, relativePath);
  //   fs.createReadStream(event.path).pipe(fs.createWriteStream(destPath));
  // });
}

// function copy(changePath, basePath, targetPath) {
  
//   const relativePath = path.relative(basePath, changePath);
//   const destPath = path.join(targetPath, relativePath);
//   // fs.createReadStream(vinyl.path).pipe(fs.createWriteStream(destPath));
// }
