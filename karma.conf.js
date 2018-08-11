const path = require('path');

module.exports = function(config) {
  config.set({

    basePath: '',
    frameworks: ["jasmine"],
    files: ["test/*.spec.ts"],
    preprocessors: {
      "**/*.ts": ["webpack"]
    },
    webpack: {
      mode: "development",
      resolve: {
        extensions: [".ts", ".js"],
        modules: ["src", "node_modules"],
        alias: {
          src: path.resolve(__dirname, "src")
        }
      },
      devtool: "cheap-module-eval-source-map",
      module: {
        rules: [
          {
            test: /\.ts$/,
            loader: "ts-loader",
            exclude: /node_modules/,
            options: {
              transpileOnly: true
            }
          }
        ]
      }
    },
    mime: {
      "text/x-typescript": ["ts"]
    },
    reporters: ["mocha", "progress"],
    webpackServer: { noInfo: config.noInfo },
    browsers: ["Chrome"],
    customLaunchers: {
      ChromeDebugging: {
        base: "Chrome",
        flags: ["--remote-debugging-port=9333"],
        debug: true
      }
    },
    singleRun: false
  });
};
