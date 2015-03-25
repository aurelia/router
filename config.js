System.config({
  "paths": {
    "*": "*.js",
    "github:*": "jspm_packages/github/*.js",
    "aurelia-router/*": "dist/*.js",
    "npm:*": "jspm_packages/npm/*.js"
  }
});

System.config({
  "map": {
    "aurelia-dependency-injection": "github:aurelia/dependency-injection@0.5.0",
    "aurelia-event-aggregator": "github:aurelia/event-aggregator@0.2.4",
    "aurelia-history": "github:aurelia/history@0.2.4",
    "aurelia-path": "github:aurelia/path@0.4.6",
    "aurelia-route-recognizer": "github:aurelia/route-recognizer@0.2.4",
    "core-js": "npm:core-js@0.4.10",
    "github:aurelia/dependency-injection@0.5.0": {
      "aurelia-logging": "github:aurelia/logging@0.2.6",
      "aurelia-metadata": "github:aurelia/metadata@0.3.4",
      "core-js": "npm:core-js@0.4.10"
    },
    "github:jspm/nodelibs-process@0.1.1": {
      "process": "npm:process@0.10.1"
    },
    "npm:core-js@0.4.10": {
      "process": "github:jspm/nodelibs-process@0.1.1"
    }
  }
});

