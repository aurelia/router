var isparta = require('isparta');
var paths = require('./build/paths');
var babelOptions = require('./build/babel-options');

module.exports = function(config) {
  var configuration = {
    frameworks: ['jspm', 'jasmine'],

    jspm: {
      config: 'config.js',
      loadFiles: [paths.tests],
      serveFiles: [paths.source]
    },

    files: [],

    preprocessors: {
      [paths.tests]: ['babel'],
      [paths.source]: ['babel', 'sourcemap', 'coverage']
    },

    babelPreprocessor: {
      options: {
        loose: babelOptions.loose,
        stage: babelOptions.stage,
        optional: babelOptions.optional,
        sourceMap: 'inline'
      }
    },

    reporters: ['coverage', 'progress'],

    coverageReporter: {
      instrumenters: {
        isparta: isparta
      },

      instrumenter: {
        [paths.source]: 'isparta'
      },

      dir: 'build/reports/coverage/',

      reporters: [{
        type: 'text-summary'
      }, {
        type: 'html',
        subdir: 'html'
      }, {
        type: 'lcovonly',
        subdir: 'lcov',
        file: 'report-lcovonly.txt'
      }]
    },

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

    browsers: ['Chrome'],

    singleRun: false
  };

  if (process.env.TRAVIS) {
    configuration.browsers = ['Chrome_travis_ci', 'Firefox'];
  }

  config.set(configuration);
};
