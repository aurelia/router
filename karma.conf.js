const path = require('path');

module.exports = function(config) {
  const browsers = config.browsers;
  config.set({

    basePath: '',
    frameworks: ["jasmine"],
    files: ["test/**/*.spec.ts"],
    preprocessors: {
      "test/**/*.spec.ts": ["webpack", 'sourcemap']
    },
    webpack: {
      mode: "development",
      entry: 'test/setup.ts',
      resolve: {
        extensions: [".ts", ".js"],
        modules: ["node_modules"],
        alias: {
          src: path.resolve(__dirname, 'src'),
          test: path.resolve(__dirname, 'test')
        }
      },
      devtool: browsers.includes('ChromeDebugging') ? 'eval-source-map' : 'inline-source-map',
      module: {
        rules: [
          {
            test: /\.ts$/,
            loader: "ts-loader",
            exclude: /node_modules/
          }
        ]
      }
    },
    mime: {
      "text/x-typescript": ["ts"]
    },
    reporters: ["mocha"],
    webpackServer: { noInfo: config.noInfo },
    browsers: Array.isArray(browsers) && browsers.length > 0 ? browsers : ['ChromeHeadless'],
    customLaunchers: {
      ChromeDebugging: {
        base: 'Chrome',
        flags: [
          '--remote-debugging-port=9333'
        ],
        debug: true
      }
    },
    mochaReporter: {
      ignoreSkipped: true
    },
    singleRun: false
  });
};
