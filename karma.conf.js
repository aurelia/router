const path = require('path');

module.exports = function(config) {
  config.set({

    basePath: '',
    frameworks: ["jasmine"],
    files: ["test/setup.ts"],
    preprocessors: {
      "**/*.ts": ["webpack", 'sourcemap']
    },
    webpack: {
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
