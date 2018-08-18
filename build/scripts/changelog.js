const gulp = require('gulp');
const paths = require('../paths');
var conventionalChangelog = require('gulp-conventional-changelog');

gulp
  .src(paths.doc + '/CHANGELOG.md', {
    buffer: false
  })
  .pipe(conventionalChangelog({
    preset: 'angular'
  }))
  .pipe(gulp.dest(paths.doc));
