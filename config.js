System.config({
  defaultJSExtensions: true,
  transpiler: "babel",
  babelOptions: {
    "optional": [
      "runtime",
      "es7.decorators"
    ]
  },
  paths: {
    "github:*": "jspm_packages/github/*",
    "aurelia-router/*": "dist/*.js",
    "npm:*": "jspm_packages/npm/*"
  },

  map: {
    "aurelia-dependency-injection": "github:aurelia/dependency-injection@0.10.0",
    "aurelia-event-aggregator": "github:aurelia/event-aggregator@0.8.0",
    "aurelia-history": "github:aurelia/history@0.7.0",
    "aurelia-logging": "github:aurelia/logging@0.7.0",
    "aurelia-pal": "github:aurelia/pal@0.1.9",
    "aurelia-path": "github:aurelia/path@0.9.0",
    "aurelia-route-recognizer": "github:aurelia/route-recognizer@0.7.0",
    "babel": "npm:babel-core@5.2.2",
    "babel-runtime": "npm:babel-runtime@5.2.2",
    "core-js": "npm:core-js@1.1.3",
    "github:aurelia/dependency-injection@0.10.0": {
      "aurelia-logging": "github:aurelia/logging@0.7.0",
      "aurelia-metadata": "github:aurelia/metadata@0.8.0",
      "core-js": "npm:core-js@0.9.18"
    },
    "github:aurelia/event-aggregator@0.8.0": {
      "aurelia-logging": "github:aurelia/logging@0.7.0"
    },
    "github:aurelia/metadata@0.8.0": {
      "core-js": "npm:core-js@0.9.18"
    },
    "github:aurelia/route-recognizer@0.7.0": {
      "aurelia-path": "github:aurelia/path@0.9.0",
      "core-js": "npm:core-js@0.9.18"
    },
    "github:jspm/nodelibs-process@0.1.1": {
      "process": "npm:process@0.10.1"
    },
    "npm:core-js@0.9.18": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.1",
      "systemjs-json": "github:systemjs/plugin-json@0.1.0"
    },
    "npm:core-js@1.1.3": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.1",
      "systemjs-json": "github:systemjs/plugin-json@0.1.0"
    }
  }
});
