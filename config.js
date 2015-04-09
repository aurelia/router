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
    "aurelia-dependency-injection": "github:aurelia/dependency-injection@0.6.0",
    "aurelia-event-aggregator": "github:aurelia/event-aggregator@0.3.0",
    "aurelia-history": "github:aurelia/history@0.3.0",
    "aurelia-path": "github:aurelia/path@0.5.0",
    "aurelia-route-recognizer": "github:aurelia/route-recognizer@0.3.0",
    "core-js": "github:zloirock/core-js@0.8.1",
    "github:aurelia/dependency-injection@0.6.0": {
      "aurelia-logging": "github:aurelia/logging@0.3.0",
      "aurelia-metadata": "github:aurelia/metadata@0.4.0",
      "core-js": "github:zloirock/core-js@0.8.1"
    },
    "github:aurelia/metadata@0.4.0": {
      "core-js": "github:zloirock/core-js@0.8.1"
    },
    "github:aurelia/route-recognizer@0.3.0": {
      "core-js": "github:zloirock/core-js@0.8.1"
    }
  }
});

