const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const tools = require('aurelia-tools');
const glob = require('glob');
const paths = require('../paths');
const args = require('./args');

gulp.task('update-own-deps', function(){
  tools.updateOwnDependenciesFromLocalRepositories();
});

gulp.task('build-dev-env', function () {
  tools.buildDevEnv();
});

gulp.task('dev', ['build'], () => {
  gulp.watch(paths.files, ['build']);

  if (args.target) {
    const projectName = require('../../package.json').name;

    const targetNPMPath = path.join(args.target, 'node_modules', projectName);
    fs.stat(targetNPMPath, (err, stats) => {
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
  gulp.watch(path.join(basePath, '**', '*'), (event) => {
    if (event.type === 'deleted') {
      return;
    }

    const relativePath = path.relative(basePath, event.path);
    const destPath = path.join(targetPath, relativePath);
    fs.createReadStream(event.path).pipe(fs.createWriteStream(destPath));
  });
}
