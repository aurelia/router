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
    "aurelia-dependency-injection": "github:aurelia/dependency-injection@0.4.0",
    "aurelia-history": "github:aurelia/history@0.2.2",
    "aurelia-path": "github:aurelia/path@0.4.1",
    "aurelia-route-recognizer": "github:aurelia/route-recognizer@0.2.2",
    "core-js": "npm:core-js@0.4.6",
    "github:aurelia/dependency-injection@0.4.0": {
      "aurelia-metadata": "github:aurelia/metadata@0.3.0",
      "core-js": "npm:core-js@0.4.6"
    },
    "github:jspm/nodelibs-process@0.1.0": {
      "process": "npm:process@0.10.0"
    },
    "npm:core-js@0.4.6": {
      "process": "github:jspm/nodelibs-process@0.1.0"
    }
  }
});

