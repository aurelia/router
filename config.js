System.config({
  "paths": {
    "*": "*.js",
    "github:*": "jspm_packages/github/*.js"
  }
});

System.config({
  "map": {
    "aurelia-dependency-injection": "github:aurelia/dependency-injection@0.0.3",
    "aurelia-history": "github:aurelia/history@0.0.1",
    "aurelia-route-recognizer": "github:aurelia/route-recognizer@0.0.1",
    "github:aurelia/dependency-injection@0.0.3": {
      "aurelia-metadata": "github:aurelia/metadata@0.0.5"
    }
  }
});

