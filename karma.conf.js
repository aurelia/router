const path = require('path');

module.exports = function(config) {
  const webpackConfigs = getWebpackConfigs(config);
  const options = {
    basePath: '',
    frameworks: ["jasmine"],
    files: ["test/setup.ts"],
    preprocessors: {
      "**/*.ts": ["webpack", 'sourcemap']
    },
    webpack: webpackConfigs,
    mime: {
      "text/x-typescript": ["ts"]
    },
    reporters: ["mocha", "progress"],
    // webpackServer: { noInfo: config.noInfo },
    browsers: ["Chrome"],
    customLaunchers: {
      ChromeDebugging: {
        base: "Chrome",
        flags: ["--remote-debugging-port=9333"],
        debug: true
      }
    },
    singleRun: false
  };
  
  if (config.coverage) {
    webpackConfigs.module.rules.push({
      enforce: 'post',
      exclude: /(node_modules|\.spec\.ts$)/,
      loader: 'istanbul-instrumenter-loader',
      options: { esModules: true },
      test: /src[\/\\].+\.ts$/
    });
    options.reporters.push('coverage-istanbul');
    options.coverageIstanbulReporter = {
      reports: ['html', 'lcovonly', 'text-summary'],
      fixWebpackSourcePaths: true
    };
  }

  config.set(options)
};

function getWebpackConfigs(cliOptions) {
  return {
    mode: "development",
    resolve: {
      extensions: [".ts", ".js"],
      modules: ["src", "node_modules"],
      // alias: {
      //   src: path.resolve(__dirname, "src")
      // }
    },
    devtool: "inline-source-map",
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
    }
  };
}
