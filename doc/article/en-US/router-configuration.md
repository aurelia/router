---
{
  "name": "Router Configuration",
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

To use Aurelia's router, your component view must have a `<router-view></router-view>` element. In order to configure the router, the component's view-model requires a `configureRouter()` function.

<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <router-view></router-view>
    </template>
  </source-code>
</code-listing>

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
          { route: 'files/*path',      name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
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
          { route: 'files/*path',      name: 'files',      moduleId: 'files/index',   href:'#files',   nav: 0 }
        ]);
      }
    }
  </source-code>
</code-listing>

You can also call `mapRoute()` on a single route configuration.

* `config.map()` adds route(s) to the router.  Although only route, name, moduleId, href and nav are shown above there are other properties that can be included in a route. The class name for each route is `RouteConfig`.
* `route` - is the pattern to match against incoming URL fragments. It can be a string or array of strings. The route can contain parameterized routes or wildcards as well.
  * Parameterized routes match against a string with a `:token` parameter (ie: 'users/:id/detail'). An object with the token parameter's name is set as property and passed as a parameter to the route view-model's `activate()` function.
  * A parameter can be made optional by appending a question mark `:token?` (ie: `users/:id?/detail` would match both `users/3/detail` and `users/detail`). When an optional parameter is missing from the url, the property passed to `activate()` is `undefined`.
  * Wildcard routes are used to match the "rest" of a path (ie: files/*path matches files/new/doc or files/temp). An object with the rest of the URL after the segment is set as the `path` property and passed as a parameter to `activate()` as well.
* `href` - is a conditionally optional property. If it is not defined then route is used. If route has segments then href is required as in the case of files because the router does not know how to fill out the parameterized portions of the pattern.
* `nav` - is a boolean or number property. When set to true the route will be included in the router's navigation model. This makes it easier to create a dynamic menu or similar elements. When specified as number, the value will be used in sorting the routes.

## [Options](aurelia-doc://section/2/version/1.0.0)

### Push State

Add [a base tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base) to the head of your html document. If you're using JSPM, RequireJS or a similar module loader, you will also need to configure it with a base url, corresponding to your base tag's `href`. Finally, be sure to set the `config.options.root` to match your base tag's setting.

<code-listing heading="Push State">
  <source-code lang="ES 2015/2016">
    export class App {
      configureRouter(config) {
        config.title = 'Aurelia';
        config.options.pushState = true;
        config.options.root = '/';
        config.map([
          { route: ['welcome'],    name: 'welcome',     moduleId: 'welcome',      nav: true, title:'Welcome' },
          { route: 'flickr',       name: 'flickr',      moduleId: 'flickr',       nav: true },
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
          { route: 'flickr',       name: 'flickr',      moduleId: 'flickr',       nav: true },
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

You can add a `navigationStrategy` to a route to allow dynamic routes. Within the navigation strategy Aurelia requires you to configure `instruction.config` with the desired `moduleId`, viewPorts or redirect.

<code-listing heading="Using a Route Navigation Strategy">
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
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true },
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
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true },
          { route: ['', 'admin*path'],   name: 'route',  navigationStrategy: navStrat }
        ]);
      }
    }
  </source-code>
</code-listing>

## [Adding Additional Data To A Route](aurelia-doc://section/4/version/1.0.0)

Although Aurelia does allow you to pass any additional property to a route's configuration object, `settings` is the default parameter to which you should add arbitrary data that you want to pass to the route.

<code-listing heading="Using Route Settings">
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        this.router = router;
        config.title = 'Aurelia';
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true, settings: {data: '...'} }
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
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true, settings: {data: '...'} }
        ]);
      }
    }
  </source-code>
</code-listing>

## [Case Sensitive Routes](aurelia-doc://section/5/version/1.0.0)

You can set a route to be case sensitive, should you wish:

<code-listing heading="Making a Route Case-Sensitive">
  <source-code lang="ES 2015/2016">
    export class App {
      configureRouter(config, router) {
        this.router = router;
        config.title = 'Aurelia';
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true, caseSensitive: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' }
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
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' }
        ]);
      }
    }
  </source-code>
</code-listing>

In the above example, our route will only match URL fragment of '/users' and not '/Users', *but* since the route 'users/:id/detail' is not case sensitive the URL Users/:id/detail would match. By default Aurelia's routes are not case sensitive.

## [Handling Unknown Routes](aurelia-doc://section/6/version/1.0.0)

Aurelia allows you to map any unknown routes. Parameters passed to `mapUnknownRoutes()` can be:

* A string to a moduleId. This module will be navigated to any time a route is not found.
* A routeConfig object. This configuration object will be used any time a route is not found.
* A function which is passed the NavigationInstruction object and can decide the route dynamically.

### Using a ModuleId for Unknown Routes

<code-listing heading="Static Unknown Routes">
  <source-code>
  <source-code lang="ES 2015/2016">

    export class App {
      configureRouter(config, router) {
        this.router = router;
        config.title = 'Aurelia';
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true, caseSensitive: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' }
        ]);

        config.mapUnknownRoutes('not-found');
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
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' }
        ]);

        config.mapUnknownRoutes('not-found');
      }
    }
  </source-code>
</code-listing>

The above example will redirect any unmatched routes to the `not-found` component module.

### Using A Function For Unknown Routes

The function passed to `mapUnknownRoutes()` has to return:

* A string to a moduleId.
* An object with property `moduleId` of type string.
* A `RouteConfig` object.
* A `Promise` that resolves to any of the above.

<code-listing heading="Dynamic Unknown Routes">
  <source-code lang="ES 2015/2016">
    export class App {
      configureRouter(config, router) {
        this.router = router;

        config.title = 'Aurelia';

        var handleUnknownRoutes = (instruction) => {
            // return 'not-found';
            return { moduleId: 'not-found' };
        }

        config.mapUnknownRoutes(handleUnknownRoutes);

        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
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

        let handleUnknownRoutes = (instruction: NavigationInstruction): {moduleId: string} => {
            // return 'not-found';
            return { moduleId: 'not-found' };
        }

        config.mapUnknownRoutes(handleUnknownRoutes);

        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }
  </source-code>
</code-listing>

## [Redirecting Routes](aurelia-doc://section/7/version/1.0.0)

Aurelia allows redirecting of routes to URL fragments by specifying redirect with a string consisting of a URL fragment.

<code-listing heading="Route Config Redirects">
  <source-code lang="ES 2015/ES 2016/TypeScript">
    config.map([
      { route: '',           redirect: 'home' },
      { route: 'home',       name: 'home',       moduleId: 'home/index' }
    ]);
  </source-code>
</code-listing>

> Info: Use Redirect On Empty Routes with Child Routers
> The `redirect` is particularly useful when you have an "empty" route pattern (such as the first route above) that maps to a component with a child router. In this case, create a non-empty route and then redirect the empty route to the non-empty route (as above). This will enable the child router to consistently match child routes without getting confused in scenarios where the empty route was matched.

## [Pipelines](aurelia-doc://section/8/version/1.0.0)

Aurelia has two router classes, `AppRouter` and `Router`. `AppRouter` extends the `Router` class and is the main application router. `Router` is used for any child routers including nested child routers. One of the main differences between the two is pipelines are only allowed on the `AppRouter` and not any child routers.

You can create your own pipeline steps using `addPipelineStep`, but the step's name must match one of the pipeline's slots, the default slots in order are `authorize`, `preActivate`, `preRender`, and `postRender`. Aurelia also has functions for creating a pipeline step for these slots.

* `authorize` is called between loading the route's step and calling the route view-model' `canActivate` function if defined.
* `preActivate` is called between the route view-model' `canActivate` function and the previous route view-model's `deactivate` function if defined.
* `preRender` is called between the route view-model's activate function and before the component is rendered/composed.
* `postRender` is called after the component has been render/composed.

A pipeline step must be an object that contains a `run(navigationInstruction, next)` function.

<code-listing heading="An Authorize Step">
  <source-code lang="ES 2015/2016">
    import {Redirect} from 'aurelia-router';

    export class App {
      configureRouter(config, router) {
        var step = new AuthorizeStep;
        config.addAuthorizeStep(step)
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index', settings: { auth: true } },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail', settings: { auth: true } },
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files', nav: true }
        ]);
      }
    }

    class AuthorizeStep {
      run(navigationInstruction, next) {
        if (navigationInstruction.getAllInstructions().some(i => i.config.settings.auth)) {
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
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }

    class AuthorizeStep {
      run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {
        if (navigationInstruction.getAllInstructions().some(i => i.config.settings.auth)) {
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

<code-listing heading="A PreActivate Step">
  <source-code lang="ES 2015/2016">
    export class App {
      configureRouter(config, router) {
        function step() {
          return step.run;
        }
        step.run = (navigationInstruction, next) => {
          return next()
        };
        config.addPreActivateStep(step)
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
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
          return next();
        };

        config.title = 'Aurelia';
        config.addPreActivateStep(step);
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }
  </source-code>
</code-listing>

<code-listing heading="A PreRender Step">
  <source-code lang="ES 2015/2016">
    export class App {
      configureRouter(config, router) {
        var step = {
          run: (navigationInstruction, next) => {
            return next()
          }
        };
        config.addPreRenderStep(step);
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
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
            return next();
          }
        };

        config.title = 'Aurelia';
        config.addPreRenderStep(step);
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
        ]);
      }
    }
  </source-code>
</code-listing>

<code-listing heading="A PostRender Step">
  <source-code lang="ES 2015/2016">
    export class App {
      configureRouter(config, router) {
        var step = {
          run: (navigationInstruction, next) => {
            return next();
          }
        };
        config.addPostRenderStep(step);
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
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
            return next();
          }
        };

        config.title = 'Aurelia';
        config.addPostRenderStep(step);
        config.map([
          { route: ['', 'home'],       name: 'home',       moduleId: 'home/index' },
          { route: 'users',            name: 'users',      moduleId: 'users/index',   nav: true },
          { route: 'users/:id/detail', name: 'userDetail', moduleId: 'users/detail' },
          { route: 'files/*path',       name: 'files',      moduleId: 'files/index',   href:'#files',   nav: true }
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

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    export class App {
      configureRouter(config, router) {
        config.title = 'Aurelia';
        config.map([
          { route: 'users', name: 'users', viewPorts: { left: { moduleId: 'user/list' }, right: { moduleId: 'user/detail' } } }
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
          { route: 'users', name: 'users', viewPorts: { left: { moduleId: 'user/list' }, right: { moduleId: 'user/detail' } } }
        ]);
      }
    }
  </source-code>
</code-listing>

## [Layouts](aurelia-doc://section/10/version/1.0.0)

> Info
> Specifying layout on the `<router-view>` element will set the default layout for all routes.

Similar to MVC-style master/layout pages, Aurelia allows configuration of multiple layouts. Here are the properties for creating layouts:

* `layoutView` property on a route object - specifies the layout view to use for the route.
* `layoutViewModel` property on a route object - specifies the view model to use with the layout view.
* `layoutModel` property on a route object - specifies the model parameter to pass to the layout view-model's activate function.

<code-listing heading="app.html">
  <source-code lang="HTML">
    <template>
      <div class="page-host">
        <router-view layout-view="views/layout-default.html"></router-view>
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

<code-listing heading="app${context.language.fileExtension}">
  <source-code lang="ES 2015/2016">
    export class App {
      configureRouter(config, router) {
        config.title = 'Aurelia';
        var model = {
          id: 1
        };
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
        var model = {
          id: 1
        };
        config.map([
          { route: 'home', name: 'home', moduleId: 'home/index' },
          { route: 'login', name: 'login', moduleId: 'login/index', layoutView: 'views/layout-login.html' },
          { route: 'users', name: 'users', moduleId: 'users/index', layoutViewModel: 'views/model', layoutModel: model }
        ]);
      }
    }
  </source-code>
</code-listing>
