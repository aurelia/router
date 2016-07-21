---
{
  "name": "Router:Configuration",
  "culture": "en-US",
  "description": "This article covers Aurelia's router configuration.",
  "engines" : { "aurelia-doc" : "^1.0.0" },
  "author": {
    "name": "Jeremy Gonzalez",
    "url": "http://www.jeremyg.net"
  },
  "contributors": [],
  "translators": [],
  "keywords": ["JavaScript", "Router"]
}
---

## [Basic Configuration](aurelia-doc://section/1/version/1.0.0)
> Info
> To use Aurelia's router your component view must have a `<router-view></router-view>` element. In order to configure the router, the component's viewmodel requires a configureRouter() function.

<code-listing heading="app.html">
  <source-code lang="HTML">

    <template>
      <router-view></router-view>
    </template>

  </source-code>
</code-listing >


<code-listing heading="Basic Route Configuration">
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        this.router = router;
        config.title = 'Aurelia';
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }

  </source-code>
  <source-code lang="TypeScript">

    import {RouterConfiguration, Router} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration, router: Router): void {
        this.router = router;
        config.title = 'Aurelia';
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }

  </source-code>
</code-listing>


> Info
> You can also call `mapRoute()` on a single route configuration.

* `config.map()` adds route(s) to the router.  Although only route, name, moduleId, href and nav are shown above there are other properties that can be included in a route. The class name for the routes are RouteConfig.
* `route` - is the pattern to match against incoming URL fragments. It can be a string, array of strings. The route can contain parameterized routes or wildcards.
  * Parameterized routes match against a string with a `:token` parameter (ie: 'users/:id/detail'). An object with the token parameter's name is set as property and passed as a parameter to the route's viewmodel activate() function.
  * Wildcard routes are used to match the "rest" of a path (ie: files*path matches files/new/doc or files/temp). An object with the rest of the URL after the segment is set as the `path` property and passes as a parameter to activate() as well.
* `href` - is a conditionally optional parameter. If it is not defined then route is used. If route has segments then href is required as in the case of files.
* `nav` - is a boolean parameter, when set to true it will be included in the routes navModel. This makes it easier to create a dynamic menu or similar elements.

## [Options](aurelia-doc://section/2/version/1.0.0)

### Push State

Add [a base tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base) to the head of your html document. If you're using JSPM, you will also need to configure it with a `baseURL` corresponding to your base tag's `href`. Finally, be sure to set the `config.options.root` to match your base tag's setting.

<code-listing heading="Push State">
  <source-code lang="ES 2015/2016">
    export class App {
      configureRouter(config) {
        config.title = 'Aurelia';
        config.options.pushState = true;
        config.options.root = '/';
        config.map([
          { route: ['welcome'],    name: 'welcome',     moduleId: 'welcome',      nav: true, title:'Welcome' },
          { route: 'flickr',       name: 'flickr',      moduleId: 'flickr',       nav: true, auth: true },
          { route: 'child-router', name: 'childRouter', moduleId: 'child-router', nav: true, title:'Child Router' },
          { route: '',             redirect: 'welcome' }
        ]);
      }
    }
  </source-code>
  <source-code lang="TypeScript">
    import {Redirect, NavigationInstruction, RouterConfiguration} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration): void {
        config.title = 'Aurelia';
        config.options.pushState = true;
        config.options.root = '/';
        config.map([
          { route: ['welcome'],    name: 'welcome',     moduleId: 'welcome',      nav: true, title:'Welcome' },
          { route: 'flickr',       name: 'flickr',      moduleId: 'flickr',       nav: true, auth: true },
          { route: 'child-router', name: 'childRouter', moduleId: 'child-router', nav: true, title:'Child Router' },
          { route: '',             redirect: 'welcome' }
        ]);
      }
    }
  </source-code>
</code-listing>

> Warning
> PushState requires server-side support. Don't forget to configure your server appropriately.

## [Dynamically Specify Route Components](aurelia-doc://section/3/version/1.0.0)

You can add a `navigationStrategy` to a route to allow dynamic routes. Within the navigationStrategy Aurelia requires you to configure instruction.config with the desired moduleId, viewPorts or redirect.

<code-listing>
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        this.router = router;
        config.title = 'Aurelia';
        var navStrat = (instruction) => {
          instruction.config.moduleId = instruction.fragment
          instruction.config.href = instruction.fragment
        }
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true },
          { route: ['', 'admin*path'],   name: 'route',  navigationStrategy: navStrat }
        ]);
      }
    }

  </source-code>
  <source-code lang="TypeScript">

    import {RouterConfiguration, Router, NavigationInstruction} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration, router: Router): void {
        this.router = router;
        config.title = 'Aurelia';
        let navStrat = (instruction: NavigationInstruction) => {
          instruction.config.moduleId = instruction.fragment
          instruction.config.href = instruction.fragment
        }
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true },
          { route: ['', 'admin*path'],   name: 'route',  navigationStrategy: navStrat }
        ]);
      }
    }
  </source-code>
</code-listing>

## [Adding Additional Data On A Route](aurelia-doc://section/4/version/1.0.0)
Although Aurelia does allow to pass any additional property to a route's configuration object, settings is the default parameter to add arbitrary data you want to pass to the route.

<code-listing>
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        this.router = router;
        config.title = 'Aurelia';
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true, settings: {data: '...'} },

        ]);
      }
    }

  </source-code>
  <source-code lang="TypeScript">

    import {RouterConfiguration, Router} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration, router: Router): void {
        this.router = router;
        config.title = 'Aurelia';
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true, settings: {data: '...'} },

        ]);
      }
    }
  </source-code>
</code-listing>

You can also pass arbitrary data using any property you would like. This property will also be on the routeConfig object within your viewmodel's activate() function.

<code-listing>
  <source-code >

    //... config.map([
        { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true, auth: true },
    //...

  </source-code>
</code-listing>

## [Case Sensitive Routes](aurelia-doc://section/5/version/1.0.0)

You can set a route to be case sensitive should you wish.

<code-listing>
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        this.router = router;
        config.title = 'Aurelia';
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true, caseSensitive: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
        ]);
      }
    }

  </source-code>
  <source-code lang="TypeScript">

    import {RouterConfiguration, Router} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration, router: Router): void {
        this.router = router;
        config.title = 'Aurelia';
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index', nav: true, caseSensitive: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
        ]);
      }
    }
  </source-code>
</code-listing>

In the above example, our route will only match URL fragment of '/users' and not '/Users', BUT since the route 'users/:id/detail' is not case sensitive the URL Users/:id/detail would match. By default Aurelia's routes are not case sensitive.

## [Handling Unknown Routes](aurelia-doc://section/6/version/1.0.0)

Aurelia allows you to map any unknown routes. Parameters passed to `mapUnknownRoutes()` can be:
* A string to a moduleId
* A routeConfig object
* A function which is passed the NavigationInstruction object

### Using a ModuleId for Unknown routes
<code-listing heading="Basic Route Configuration">
  <source-code>
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        this.router = router;
        config.title = 'Aurelia';
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true, caseSensitive: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
        ]);
        config.mapUnknownRoutes("notfound")
      }
    }

  </source-code>
  <source-code lang="TypeScript">

    import {RouterConfiguration, Router} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration, router: Router): void {
        this.router = router;
        config.title = 'Aurelia';
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index', nav: true, caseSensitive: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
        ]);
        config.mapUnknownRoutes("notfound") //moduleId
      }
    }
  </source-code>
</code-listing>

The above example will redirect any unmatched routes to the notfound component page.

### Using A Function For Unknown Routes

<code-listing>
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        this.router = router;
        config.title = 'Aurelia';
        var navStrat = (instruction) => {
          if (instruction.config === null) {
            return 'notfound' //a notfound moduleId
          }
          instruction.config.moduleId = instruction.fragment
          instruction.config.href = instruction.fragment
        }
        config.mapUnknownRoutes(navStrat)
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true },
          {route: ['', 'admin*path'],   name: 'route',  navigationStrategy: navStrat }
        ]);
      }
    }

  </source-code>
  <source-code lang="TypeScript">

    import {RouterConfiguration, NavigationInstruction, Router} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration, router: Router): void {
        this.router = router;
        config.title = 'Aurelia';
        let navStrat = (instruction: NavigationInstruction) => {
          if (instruction.config === null) {
            return 'notfound' //notfound moduleId
          }
          instruction.config.moduleId = instruction.fragment
          instruction.config.href = instruction.fragment
        }
        config.mapUnknownRoutes(navStrat)
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true },
          {route: ['', 'admin*path'],   name: 'route',  navigationStrategy: navStrat }
        ]);
      }
    }
  </source-code>
</code-listing>

### Using A Route Config For Unknown Routes.

<code-listing>
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        this.router = router;
        config.title = 'Aurelia';
        config.mapUnknownRoutes({route: 'notfound', moduleId: 'notfound'})
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }

  </source-code>
  <source-code lang="TypeScript">

    import {RouterConfiguration, RouteConfig, Router} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration, router: Router): void {
        this.router = router;
        config.title = 'Aurelia';
        let route: RouteConfig = {
          route: 'notfound',
          moduleId: 'notfound'
        }
        config.mapUnknownRoutes(route)
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }
  </source-code>
</code-listing>

## [Redirecting Routes](aurelia-doc://section/7/version/1.0.0)

Aurelia allows redirecting of routes to URL fragments by specifying redirect with a string consisting of a URL fragment.

<code-listing>
  <source-code >

    // config.map([
      { route: 'home',       name: 'home',       moduleId: 'home/index' },
      { route: '',           redirect: 'home' },
    //...

  </source-code>
</code-listing>

## [Pipelines](aurelia-doc://section/8/version/1.0.0)

Aurelia has two router classes, AppRouter and Router. AppRouter extends the Router class and is the main application router. Router is used for any child routers including nested child routers. One of the main differences between the two is pipelines are only allowed on the AppRouter and not any child routers.

You can create your own pipeline steps using `addPipelineStep`, but the step's name must match one of the pipeline's slots, the default slots in order are `authorize`, `preActive`, `preRender`, and `postRender`. Aurelia also has functions for creating a pipeline step for these slots.

* `authorize` is called between loading the route's step and calling the route's viewmodel CanActivate function if defined.
* `preActive` is called between the route's viewmodel CanActivate function and the previous route's viewmodel deactivate function if defined.
* `preRender` is called between the route's viewmodel activate function and before the component is rendered/composed.
* `postRender` is called after the component has been render/composed.

A pipeline step must contain a `run(navigationInstruction,next)` function.

### Authorize Pipeline

<code-listing>
  <source-code lang="ES 2015/2016">

    import {Redirect} from 'aurelia-router';

    export class App {
      configureRouter(config, router) {
        config.addAuthorizeStep(step)
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true,     auth: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail',  auth: true },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files', nav: true }
        ]);
      }
    }

    class AuthorizeStep {
      run(navigationInstruction, next) {
        if (navigationInstruction.getAllInstructions().some(i => i.config.auth)) {
          var isLoggedIn = // insert magic here;
          if (!isLoggedIn) {
            return next.cancel(new Redirect('login'));
          }
        }

        return next();
      }
    }

  </source-code>
  <source-code lang="TypeScript">

    import {Redirect, NavigationInstruction, RouterConfiguration, Router} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration, router: Router): void {
        config.title = 'Aurelia';
        config.addPipelineStep('authorize', AuthorizeStep);
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }

    class AuthorizeStep {
      run(navigationInstruction: NavigationInstruction, next: Function): Promise<any> {
        if (navigationInstruction.getAllInstructions().some(i => i.config.auth)) {
          var isLoggedIn = //insert magic here;
          if (!isLoggedIn) {
            return next.cancel(new Redirect('login'));
          }
        }

        return next();
      }
    }

  </source-code>
</code-listing>

### Create A Pre Active Pipeline

<code-listing>
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        function step() {
          return step.run
        }
        step.run = (navigationInstruction, next) => {
          return next()
        }
        config.addPreActivateStep(step)
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }
  </source-code>
  <source-code lang="TypeScript">

    import {Redirect, NavigationInstruction, RouterConfiguration} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration): void {
        function step() {
          return step.run
        }
        step.run = (navigationInstruction: NavigationInstruction, next: Function): Promise<any> {
          return next()
        }

        config.title = 'Aurelia';
        config.addPreActivateStep(step);
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }
  </source-code>
</code-listing>

### Create A Pre Render Pipeline

<code-listing>
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        var step = {
          run: (navigationInstruction, next) => {
            return next()
          }
        }
        config.addPreRenderStep(step)
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }
  </source-code>
  <source-code lang="TypeScript">

    import {Redirect, NavigationInstruction, RouterConfiguration} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration): void {
        let step = {
          run: (navigationInstruction: NavigationInstruction, next: Function): Promise<any> {
            return next()
          }
        }

        config.title = 'Aurelia';
        config.addPreRenderStep(step);
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }
  </source-code>
</code-listing>

### Create a Post Render Pipeline

<code-listing>
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        var step = {
          run: (navigationInstruction, next) => {
            return next()
          }
        }
        config.addPostRenderStep(step)
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }
  </source-code>
  <source-code lang="TypeScript">

    import {Redirect, NavigationInstruction, RouterConfiguration, Router} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration, router: Router): void {

        let step = {
          run: (navigationInstruction: NavigationInstruction, next: Function): Promise<any> {
            return next()
          }
        }

        config.title = 'Aurelia';
        config.addPostRenderStep(step);
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }
  </source-code>
</code-listing>

### Create Your Own Pipeline Slot and step

Aurelia also allows creation of a pipeline slot where you can add steps. You will need to insert the slot in the order you want it processed. You can view a list of slots in the [pipeline-provider](https://github.com/aurelia/router/blob/master/src/pipeline-provider.js#L36-L49)
<code-listing>
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        config.title = 'Aurelia';

        function step() {
          return step.run
        }
        step.run = (navigationInstruction, next) => {
          return next()
        }
        var pipelineSlot = router.pipelineProvider._createPipelineSlot('customStep')
        var index = 1
        router.pipelineProvider.steps.splice(index, 1, pipelineSlot)

        config.addPipelineStep('customStep', step)
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }

  </source-code>
  <source-code lang="TypeScript">

    import {Redirect, NavigationInstruction, RouterConfiguration, Router} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration, router: Router): void {
        config.title = 'Aurelia';

        function step() {
          return step.run
        }
        step.run = (navigationInstruction: NavigationInstruction, next: Function): Promise<any> {
          return next()
        }
        let pipelineSlot = router.pipelineProvider._createPipelineSlot('customStep')
        let index = 1
        router.pipelineProvider.steps.splice(index, 1, pipelineSlot)

        config.addPipelineStep('customStep', step)


        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }

  </source-code>
</code-listing>

## [Rendering View Ports](aurelia-doc://section/9/version/1.0.0)
> Info
> If you don't name a router-view, it will be available under the name 'default'.

<code-listing heading="app.html">
  <source-code lang="HTML">

    <template>
      <div class="page-host">
        <router-view name="left"></router-view>
      </div>
      <div class="page-host">
        <router-view name="right"></router-view>
      </div>
    </template>

  </source-code>
</code-listing>

<code-listing>
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        config.title = 'Aurelia';
        config.map([
          { route: 'users', name: 'users', viewports: { left: { moduleId: 'user/list' }, right: { moduleId: 'user/detail' } } }
        ]);
      }
    }

  </source-code>
  <source-code lang="TypeScript">

    import {Redirect, NavigationInstruction, RouterConfiguration, Router} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration, router: Router): void {
        config.title = 'Aurelia';
        config.map([
          { route: 'users', name: 'users', viewports: { left: { moduleId: 'user/list' }, right: { moduleId: 'user/detail' } } }
        ]);
      }
    }
  </source-code>
</code-listing>

## [Layouts](aurelia-doc://section/10/version/1.0.0)
> Info
> Specifying layout on the <router-view> element will set the default layout for all routes.

Similar to MVC master/layout pages. Aurelia allows configuration of multiple layouts. Here are the properties for creating layouts:

* `layoutView` property on a route object - specifies the layout view to use for the route.
* `layoutViewModel` property on a route object - specifies the view model to use with the layout view.
* `layoutModel` property on a route object - specifies the model parameter to pass to the layout's viewmodels activate function.

<code-listing heading="app.html">
  <source-code lang="HTML">

    <template>
      <div class="page-host">
        <router-view layout="views/layout-default.html"></router-view>
      </div>
    </template>

  </source-code>
</code-listing>

<code-listing heading="layout.html">
  <source-code lang="HTML">

    <template>
      <div class="left-content">
        <slot name="aside-content"></slot>
      </div>
      <div class="right-content">
        <slot name="main-content"></slot>
      </div>
    </template>

  </source-code>
</code-listing>

<code-listing heading="module.html">
  <source-code lang="HTML">

    <template>
      <div slot="main-content">
        <p>I'm content that will show up on the right.</p>
      </div>
      <div slot="aside-content">
        <p>I'm content that will show up on the left.</p>
      </div>
    </template>

  </source-code>
</code-listing>

<code-listing>
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        config.title = 'Aurelia';
        var model = {
          id: 1
        }
        config.map([
          { route: 'home', name: 'home', moduleId: 'home/index' },
          { route: 'login', name: 'login', moduleId: 'login/index', layoutView = 'views/layout-login.html' },
          { route: 'users', name: 'users', moduleId: 'users/index', layoutViewModel = 'views/model', layoutModel: model }
        ]);
      }
    }

  </source-code>
  <source-code lang="TypeScript">

    import {Redirect, NavigationInstruction, RouterConfiguration, Router} from 'aurelia-router';

    export class App {
      configureRouter(config: RouterConfiguration, router: Router): void {
        config.title = 'Aurelia';
        config.map([
          { route: 'home', name: 'home', moduleId: 'home/index' },
          { route: 'login', name: 'login', moduleId: 'login/index', layoutView = 'views/layout-login.html' },
          { route: 'users', name: 'users', moduleId: 'users/index', layoutViewModel = 'views/model', layoutModel: model }
        ]);
      }
    }

  </source-code>
</code-listing>
