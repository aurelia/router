const path = require('path');

const BASE_DIR = __dirname;

module.exports = function (config) {
  const webpackConfigs = getWebpackConfigs(config);
  const browsers = config.browsers;
  const options = {
    basePath: '',
    frameworks: ["jasmine"],
    files: [
      'test/setup.ts',
      'test/setup.integration.ts'
    ],
    preprocessors: {
      "**/*.ts": ["webpack", 'sourcemap']
    },
    webpack: webpackConfigs,
    mime: {
      "text/x-typescript": ["ts"]
    },
    reporters: ["mocha"],
    webpackServer: { noInfo: true },
    browsers: Array.isArray(browsers) && browsers.length > 0 ? browsers : ['Chrome'],
    customLaunchers: {
      ChromeDebugging: {
        base: "Chrome",
        flags: ["--remote-debugging-port=9333"],
        debug: true
      }
    },
    singleRun: false,
    mochaReporter: {
      ignoreSkipped: true,
    }
  };

  if (config.coverage) {
    webpackConfigs.module.rules.push({
      enforce: 'post',
      exclude: /(node_modules|\.spec\.ts$)/,
      loader: 'istanbul-instrumenter-loader',
      options: {
        esModules: true,
        produceSourceMap: true,
      },
      test: /src[\/\\].+\.ts$/
    });
    options.reporters.push('coverage-istanbul');
    // options.reporters.push('coverage');
    // options.coverageReporter = {
    //   dir: 'coverage/',
    //   reporters: [
    //     { type: 'text-summary' },
    //     { type: 'json' },
    //     { type: 'html' }
    //   ]
    // };
    options.coverageIstanbulReporter = {
      reports: ['html', 'lcovonly', 'text-summary'],
      fixWebpackSourcePaths: true
    };
  }

  config.set(options);
};

function getWebpackConfigs(cliOptions) {
  const webpack = require('webpack');
  const { AureliaPlugin } = require('aurelia-webpack-plugin');

  return {
    mode: "development",
    resolve: {
      extensions: [".ts", ".js"],
      modules: ["src", "node_modules"],
      alias: {
        'aurelia-router': path.resolve(BASE_DIR, 'src', 'index')
      }
    },
    context: BASE_DIR,
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: "ts-loader",
          exclude: /node_modules/,
          options: {
            // load this relatively to each entry file
            configFile: './tsconfig-test.json'
          }
        }
      ]
    },
    plugins: [
      new AureliaPlugin({
        aureliaApp: undefined,
        aureliaConfig: [
          "defaultBindingLanguage",
          "history",
          "defaultResources",
          'developmentLogging',
          'router'
        ],
        noWebpackLoader: true,
      })
    ]
  };
}
