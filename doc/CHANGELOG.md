<a name="1.6.3"></a>
## [1.6.3](https://github.com/aurelia/router/compare/1.6.2...1.6.3) (2018-09-27)


### Bug Fixes

* **typings:** Revert aliasing interface ([59e4cf2](https://github.com/aurelia/router/commit/59e4cf2))
* Prevent running CanDeactivatePreviousStep twice in same navigation ([54b3654](https://github.com/aurelia/router/commit/54b3654)), closes [#45](https://github.com/aurelia/router/issues/45)



<a name="1.6.2"></a>
## [1.6.2](https://github.com/aurelia/router/compare/1.6.1...1.6.2) (2018-07-17)


### Bug Fixes

* **navigation-plan:** Accept parameters in a redirect config ([7172ed2](https://github.com/aurelia/router/commit/7172ed2)), closes [#607](https://github.com/aurelia/router/issues/607)
* Forward options argument to parent router.generate ([78aad40](https://github.com/aurelia/router/commit/78aad40)), closes [#606](https://github.com/aurelia/router/issues/606)
* Update baseUrl when creating a navigation instruction ([e801550](https://github.com/aurelia/router/commit/e801550)), closes [#378](https://github.com/aurelia/router/issues/378) [#605](https://github.com/aurelia/router/issues/605)



<a name="1.6.1"></a>
## [1.6.1](https://github.com/aurelia/router/compare/1.6.0...1.6.1) (2018-06-19)

### Bug Fixes

* **navigation-plan:** fix regression related to substate redirects

<a name="1.6.0"></a>
# [1.6.0](https://github.com/aurelia/router/compare/1.5.0...1.6.0) (2018-06-19)


### Bug Fixes

* **app-router:** await navigation result ([3d1c416](https://github.com/aurelia/router/commit/3d1c416))
* **interfaces:** Undo interface export ([e21fc9c](https://github.com/aurelia/router/commit/e21fc9c))
* **navigation:** add NavigationResult type ([089aa37](https://github.com/aurelia/router/commit/089aa37))
* **redirect:** do not use Promise.reject on redirect ([487c33d](https://github.com/aurelia/router/commit/487c33d)), closes [#480](https://github.com/aurelia/router/issues/480)
* **router:** define title property ([2ad2280](https://github.com/aurelia/router/commit/2ad2280))
* **router:** make addRoute split list of routes into multiple routeconfigs with single route each ([0cd5423](https://github.com/aurelia/router/commit/0cd5423))
* **router-configuration:** merge options instead of assign in exportRouter ([d563f8a](https://github.com/aurelia/router/commit/d563f8a))
* **router-configuration:** throw early on invalid pipeline steps ([e6e2f62](https://github.com/aurelia/router/commit/e6e2f62))
* **typings:** moduleId: string|null ([a7cdb68](https://github.com/aurelia/router/commit/a7cdb68))


### Features

* **router:** add configurable title separator ([d2a1896](https://github.com/aurelia/router/commit/d2a1896))
* **router:** redirect with token parameters ([aafa070](https://github.com/aurelia/router/commit/aafa070)), closes [#483](https://github.com/aurelia/router/issues/483)
* **type declarations:** improve type of RouterConfiguration ([c1775e5](https://github.com/aurelia/router/commit/c1775e5))



<a name="1.5.0"></a>
# [1.5.0](https://github.com/aurelia/router/compare/1.4.0...1.5.0) (2018-01-15)


### Bug Fixes

* **navigation-instruction:** Wait to swap child routes ([1432234](https://github.com/aurelia/router/commit/1432234))


### Features

* **router:** Enhance optional view port feature ([bcf4e33](https://github.com/aurelia/router/commit/bcf4e33))
* **router:** optional viewports ([8878b45](https://github.com/aurelia/router/commit/8878b45))
* **router:** viewport defaults ([0bfc4bc](https://github.com/aurelia/router/commit/0bfc4bc)), closes [aurelia/router#482](https://github.com/aurelia/router/issues/482)
* **router config:** ignoreUnknownRoutes option ([811959b](https://github.com/aurelia/router/commit/811959b))



<a name="1.4.0"></a>
# [1.4.0](https://github.com/aurelia/router/compare/1.3.0...1.4.0) (2017-10-02)


### Bug Fixes

* **activation:** Deactivate child viewModels when replacing a parent ([f73b6d5](https://github.com/aurelia/router/commit/f73b6d5))
* **router:** fix NavigationInstructionInit's queryParams ([1266b0b](https://github.com/aurelia/router/commit/1266b0b))
* **router:** getBaseUrl() to return correct URL for encodable chars ([0ef12f6](https://github.com/aurelia/router/commit/0ef12f6))


### Features

* **activation:** call can/Deactivate with navigationInstructions ([3d3c444](https://github.com/aurelia/router/commit/3d3c444)), closes [#493](https://github.com/aurelia/router/issues/493)
* **router:** enable parent chain unknown route handlers ([f692bcb](https://github.com/aurelia/router/commit/f692bcb))
* **type declarations:** Refine the type ([638aef4](https://github.com/aurelia/router/commit/638aef4))



<a name="1.3.0"></a>
# [1.3.0](https://github.com/aurelia/router/compare/1.2.1...v1.3.0) (2017-04-05)


### Features

* **viewport:** add viewport name to life cycle arguments ([34ef2c4](https://github.com/aurelia/router/commit/34ef2c4))



<a name="1.2.1"></a>
## [1.2.1](https://github.com/aurelia/router/compare/1.2.0...v1.2.1) (2017-02-27)


### Bug Fixes

* **activation:** regression in deactivate ([8ef8840](https://github.com/aurelia/router/commit/8ef8840))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/aurelia/router/compare/1.1.1...v1.2.0) (2017-02-21)

## Bug Fixes

* Fix fix child urls with emptys
* 411 bug fix
* fix pipeline return type

## Features

* add isExplicitNavigation and isExplicitNavigationBack

<a name="1.1.1"></a>
## [1.1.1](https://github.com/aurelia/router/compare/1.1.0...v1.1.1) (2017-01-06)


### Bug Fixes

* **Router:** fix an error when updateTitle is called but there is not current instruction ([872fda1](https://github.com/aurelia/router/commit/872fda1))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/aurelia/router/compare/1.0.7...v1.1.0) (2016-12-03)


### Features

* **router:** add extension point to transform titles when the document title is built ([629da8c](https://github.com/aurelia/router/commit/629da8c))
* **router:** add extension point to transform titles when the document title is built ([2c40ce1](https://github.com/aurelia/router/commit/2c40ce1)), closes [#343](https://github.com/aurelia/router/issues/343)
* **router:** add extension point to transform titles when the document title is built ([3d42256](https://github.com/aurelia/router/commit/3d42256)), closes [#343](https://github.com/aurelia/router/issues/343)



<a name="1.0.6"></a>
## [1.0.6](https://github.com/aurelia/router/compare/1.0.5...v1.0.6) (2016-10-06)


### Bug Fixes

* **tsd:** define router property in NavigationInstruction ([bec3a3b](https://github.com/aurelia/router/commit/bec3a3b))



<a name="1.0.5"></a>
## [1.0.5](https://github.com/aurelia/router/compare/1.0.4...v1.0.5) (2016-09-29)


### Bug Fixes

* **typings:** RoutableComponentCanActivate.canActivate should accept `Promise<NavigationCommand>` as return type. ([4460100](https://github.com/aurelia/router/commit/4460100)), closes [#401](https://github.com/aurelia/router/issues/401)



<a name="1.0.3"></a>
## [1.0.3](https://github.com/aurelia/router/compare/1.0.2...v1.0.3) (2016-09-13)


### Bug Fixes

* **router:** add navigationStrategy to cloned route config ([dc3a292](https://github.com/aurelia/router/commit/dc3a292))
* **router:** safer execution of custom navigation strategies ([fab2d21](https://github.com/aurelia/router/commit/fab2d21))



<a name="1.0.2"></a>
## [1.0.2](https://github.com/aurelia/router/compare/1.0.1...v1.0.2) (2016-07-27)


### Bug Fixes

* **router:** remove name unique checking since it breaks most apps ([35c67bc](https://github.com/aurelia/router/commit/35c67bc))



<a name="1.0.1"></a>
## [1.0.1](https://github.com/aurelia/router/compare/1.0.0...v1.0.1) (2016-07-27)


### Bug Fixes

* **router:** validation failed for un-named routes ([66b415b](https://github.com/aurelia/router/commit/66b415b))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/aurelia/router/compare/1.0.0-rc.1.0.5...v1.0.0) (2016-07-27)


### Bug Fixes

* **router:** ensure routes have distinct names ([bbd7939](https://github.com/aurelia/router/commit/bbd7939))


### Features

* **interfaces.js:** add RoutableComponent interface ([434ce9a](https://github.com/aurelia/router/commit/434ce9a))



<a name="1.0.0-rc.1.0.2"></a>
# [1.0.0-rc.1.0.2](https://github.com/aurelia/router/compare/1.0.0-rc.1.0.1...v1.0.0-rc.1.0.2) (2016-07-24)



<a name="1.0.0-rc.1.0.1"></a>
# [1.0.0-rc.1.0.1](https://github.com/aurelia/router/compare/1.0.0-rc.1.0.0...v1.0.0-rc.1.0.1) (2016-07-12)


### Bug Fixes

* **navigation-instruction:** incorrect base url extraction ([b8036e4](https://github.com/aurelia/router/commit/b8036e4)), closes [#309](https://github.com/aurelia/router/issues/309)
* **router:** navigation model explicit href normalization ([e80a16c](https://github.com/aurelia/router/commit/e80a16c))


### Features

* **nav-model:** add router property to dts ([fe0070c](https://github.com/aurelia/router/commit/fe0070c)), closes [#359](https://github.com/aurelia/router/issues/359)



<a name="1.0.0-rc.1.0.0"></a>
# [1.0.0-rc.1.0.0](https://github.com/aurelia/router/compare/1.0.0-beta.2.0.1...v1.0.0-rc.1.0.0) (2016-06-22)



### 1.0.0-beta.1.2.4 (2016-05-31)


#### Bug Fixes

* **router:**
  * change refresh navigation to check config for static href not nav model href ([24de2927](http://github.com/aurelia/router/commit/24de29274bed6521741856ed32932a410ad61897))
  * change refresh navigation to check config for static href not nav model href ([ba75d4f6](http://github.com/aurelia/router/commit/ba75d4f6c800e801cda5819bf8676a4e53b9bd52))
  * change refresh navigation to check config for static href not nav model href ([5a13d19f](http://github.com/aurelia/router/commit/5a13d19f8d7661e77566d72637dc8d6b8ab22568))


#### Features

* **router:**
  * observables in lifecycle ([337d95ab](http://github.com/aurelia/router/commit/337d95abcdde9dd9275486269c11dfff1ec76380))
  * observables in lifecycle ([8798043a](http://github.com/aurelia/router/commit/8798043a6985ddd298991a6568d65c2ac99cc248))
  * observables in lifecycle ([9b969ad8](http://github.com/aurelia/router/commit/9b969ad8db787f1920a5ee4dcd6c17786c9e4103))
  * observables in lifecycle ([31a801a6](http://github.com/aurelia/router/commit/31a801a692f327f3c1fcce9cefb859734fd98590))
  * observables in lifecycle ([deed114e](http://github.com/aurelia/router/commit/deed114ed222f95e8324e3090abec565530eaaef))
  * observables in lifecycle ([38bcad5f](http://github.com/aurelia/router/commit/38bcad5f2797a18b581c6e7c99526180b5f8dde9))


### 1.0.0-beta.1.2.3 (2016-05-17)


#### Features

* **PipelineProvider:** add methods for removing pipeline steps ([e7cb7f5a](http://github.com/aurelia/router/commit/e7cb7f5a556aa1d5d29e3dfd285efe29207039b3))


### 1.0.0-beta.1.2.2 (2016-05-10)


#### Bug Fixes

* **router:** router is case sensitive by default ([b7cd6f05](http://github.com/aurelia/router/commit/b7cd6f05512457dcff90264b4cdd611ab9741e80))


#### Features

* **router:** generate absolute URI from router ([6c468265](http://github.com/aurelia/router/commit/6c46826524e8cabd70c9828daa243b5b9eb5bc81), closes [#88](http://github.com/aurelia/router/issues/88))


### 1.0.0-beta.1.2.1 (2016-04-13)


#### Features

* add support for RedirectToRoute ([778fbc81](http://github.com/aurelia/router/commit/778fbc8146afe81f37fd7aff79d1c9c8e519df3f))


### 1.0.0-beta.1.2.0 (2016-03-22)


#### Features

* **router:** add option to compare query params ([37ab9fad](http://github.com/aurelia/router/commit/37ab9fadc16c884335e4531bb0c934621926d795), closes [#268](http://github.com/aurelia/router/issues/268))


### 1.0.0-beta.1.1.3 (2016-03-01)


#### Bug Fixes

* **pipeline-provider:** enable custom pipeline steps with ease ([99b4f599](http://github.com/aurelia/router/commit/99b4f5992af5af7b5930ebbe6cca8ad7e6c9e3f7))
* **router:** fix regression in route pipelines ([c6262616](http://github.com/aurelia/router/commit/c626261688fc5ed39ee03b51a11d029f25330cc9))


### 1.0.0-beta.1.1.2 (2016-03-01)


#### Bug Fixes

* **all:** remove core-js ([44c5e848](http://github.com/aurelia/router/commit/44c5e848e2ffe233930de0b852fbe8663bc67cbb))
* **bower:** remove core-js ([52fe3fef](http://github.com/aurelia/router/commit/52fe3fef588e36044cfc8097d3e8a90cdac61df9))
* **router:**
  * log helpful error on missing viewport ([224f5ace](http://github.com/aurelia/router/commit/224f5ace08b9359d1c035b42f1ae0a9e6f74652b), closes [#241](http://github.com/aurelia/router/issues/241))
  * add NavModel to RouteConfig interface ([064fbca5](http://github.com/aurelia/router/commit/064fbca58f6654daa866075fa7a6157c6e13467e), closes [#285](http://github.com/aurelia/router/issues/285))


### 1.0.0-beta.1.1.1 (2016-02-08)


### 1.0.0-beta.1.1.0 (2016-01-29)


#### Features

* **all:** update jspm meta; core-js; aurelia deps ([b473fec1](http://github.com/aurelia/router/commit/b473fec110d27e5572c1e094f20755fd5eeb7fd6))


### 1.0.0-beta.2 (2016-01-08)


#### Bug Fixes

* **app-router:** restore _queue object reference ([9f48f6be](http://github.com/aurelia/router/commit/9f48f6bedbab867f9865c2bd6d41d84323efa8e9))
* **pipeline:** Fix type annotations on pipeline next parameter ([b47a0dcf](http://github.com/aurelia/router/commit/b47a0dcff567d4926d6b8fe1a9e7032ab88dac6c), closes [#265](http://github.com/aurelia/router/issues/265))


#### Features

* **router:** add rest method ([dbce60c3](http://github.com/aurelia/router/commit/dbce60c37bc94e74ff7e279ae28b3b770b5ff764))


### 1.0.0-beta.1 (2015-11-16)


#### Bug Fixes

* **router:** delay ensureConfigured() promise resolution until after the root router ha activ ([7efcb81a](http://github.com/aurelia/router/commit/7efcb81a510889662975260aea113b293fed2e33), closes [#251](http://github.com/aurelia/router/issues/251))


### 0.14.1 (2015-11-15)


#### Bug Fixes

* **all:** improve type annotations ([167a4eaf](http://github.com/aurelia/router/commit/167a4eaf9c751e0f0be0793a137fb81fc470b425), closes [#248](http://github.com/aurelia/router/issues/248))


## 0.14.0 (2015-11-10)


#### Bug Fixes

* **all:** update to use viewModel terminology internally ([f01282b6](http://github.com/aurelia/router/commit/f01282b6be7e0a96f9731caebb90f97ee7918bac))
* **navigation-instruction:** remove references to previous instructions after navigation is committed ([7fa6e0b9](http://github.com/aurelia/router/commit/7fa6e0b97370f08a4e3b1c08bad2ea1eded330f4), closes [#207](http://github.com/aurelia/router/issues/207))
* **router:**
  * make `router.refreshNavigation()` public ([331bd514](http://github.com/aurelia/router/commit/331bd514a6377a65f6c4ada6bb1c142af5c09d96))
  * Fix bug where previous nav models were not deactivated in child routers ([ef0aa0e6](http://github.com/aurelia/router/commit/ef0aa0e6521fd183d7fb886f858b9aaeacdff42a))
  * fix typo in doc comment ([c13abf5d](http://github.com/aurelia/router/commit/c13abf5d47e6cccc273ae3f7bdd41b1f8f827cdc))
  * fix up type annotations and private properties ([a96ed779](http://github.com/aurelia/router/commit/a96ed779404cca7c35c7d4364652f9084334470a))
  * make configure slightly more resilient ([fff97eb2](http://github.com/aurelia/router/commit/fff97eb2ee5b03f3341243e03468591b46dbfdea))
* **updateTitle:** use private method name ([9ea95ac7](http://github.com/aurelia/router/commit/9ea95ac780acd9880b61c1c4c8ee43752fcd89c1))


#### Features

* **all:** fill in doc comments and rename private APIs ([57257adf](http://github.com/aurelia/router/commit/57257adfe85b8a7818271164e4bcb6fcce4a28f0))
* **router:**
  * remove `router.reset()` ([fa4e412b](http://github.com/aurelia/router/commit/fa4e412b2d3c6665380d77473895839cb08a059b))
  * improve support for unknown route handlers ([4aa9bc9e](http://github.com/aurelia/router/commit/4aa9bc9ed57e9655db6d37d5a52dd16577bf2b33), closes [#234](http://github.com/aurelia/router/issues/234))
  * don't automatically use conventional routing when no unknown handler is specifie ([5a80996a](http://github.com/aurelia/router/commit/5a80996a6a7fe878b488bac2362688c504bf8f03))


#### Breaking Changes

* * Pipeline steps now receive the NavigationInstruction instead of the NavigationContext. Pipeline steps should use `instruction.getAllInstructions()` and `instruction.getAllPreviousInstructions()` instead of `context.nextInstructions` and `context.currentInstructions`, respectively, to inspect current and previous instructions.

*Semantics have changed in names such as "prevInstruction" such that "current" refers to the current navigation, and "previous" refers to the previous navigation. Currently, "next" referred to the current navigation, and "current" and "previous" both referred to the previous navigation.

 ([a6f47887](http://github.com/aurelia/router/commit/a6f4788735059da2682205c059d53e1c9c83c34f))
* Unknown route handlers must now return the moduleId or route config instead of mutating `instruction.config`.

Fixes #234

 ([4aa9bc9e](http://github.com/aurelia/router/commit/4aa9bc9ed57e9655db6d37d5a52dd16577bf2b33))
* calling `router.handleUnknownRoutes()` with no arguments will no longer cause the router to apply conventional routing. This logic must now be provided by the application.

 ([5a80996a](http://github.com/aurelia/router/commit/5a80996a6a7fe878b488bac2362688c504bf8f03))


## 0.13.0 (2015-10-13)


#### Bug Fixes

* **all:**
  * update executionContext to bindingContext ([236db1db](http://github.com/aurelia/router/commit/236db1db949292e6d39583a4a794c3459605d3d2))
  * update compiler, core-js and pipeline ([f86d6dbc](http://github.com/aurelia/router/commit/f86d6dbcad8d2293f3e2c49bed0246a4963a0cf4))
* **app-router:**
  * previously assumed very specific component structure ([df9d089a](http://github.com/aurelia/router/commit/df9d089a77dbb10d3547ada9900959a3bb3ff909))
  * log navigation errors before attempting to restore previous location ([5c8ee83d](http://github.com/aurelia/router/commit/5c8ee83df6bffb86d58d7ab55884b639e26e8714))
  * handle non-promise return values from configureRouter ([f2709d60](http://github.com/aurelia/router/commit/f2709d603ac3c92487371a5bad871a53768e9f17))
  * throw a more helpful error when a pipeline step fails to return a result ([0f1eda20](http://github.com/aurelia/router/commit/0f1eda20d7e0df7d4472af8946b21a2d75ff3857))
  * catch pipeline processing errors ([36f20a6e](http://github.com/aurelia/router/commit/36f20a6e163de29fd532dcdf5f7428cda9171278))
* **bower:** bad version number ([42c065a3](http://github.com/aurelia/router/commit/42c065a34b1e1c3b39546a5a9d7d32cfd6f3df2d))
* **build:**
  * update linting, testing and tools ([2203b887](http://github.com/aurelia/router/commit/2203b88733b2aee4c731a2e4845096bc57aacef2))
  * add missing bower bump ([8fab77de](http://github.com/aurelia/router/commit/8fab77ded0f490aee8bc3689313b462edb97206b))
* **es6:** removed the custom extend helper in place of Object.assign ([308855d4](http://github.com/aurelia/router/commit/308855d41fa51a3478c12e59ce85eb873de3a16c))
* **interfaces:** add settings property to route config interface ([3e8355f5](http://github.com/aurelia/router/commit/3e8355f5d5ce521c56d3fc11c8a5303b4d0a409f), closes [#208](http://github.com/aurelia/router/issues/208))
* **navigation:** route config href was not used in router.navigation ([ea60eef9](http://github.com/aurelia/router/commit/ea60eef9e1f70d6bc4a46475da6e9295d0bb0f41))
* **navigation-command:** add explicit interface for commands interested in child routers ([1e1c4d3b](http://github.com/aurelia/router/commit/1e1c4d3b0389ad3725051a4c04c2482ea595eac1))
* **navigation-commands:** parameter options in constructor of Redirect class is optional ([b43af880](http://github.com/aurelia/router/commit/b43af8800c7a36fa29dc7e4a7a969eaa65e90709))
* **navigation-context:** navigation result not returned ([2890bfde](http://github.com/aurelia/router/commit/2890bfdeec182f4ff274e84f0429f58af37b61bb))
* **navigation-instruction:** query string causes error in child routers ([e4c6e688](http://github.com/aurelia/router/commit/e4c6e688faac329dd3d9bdf5a989d9d3870bf88d), closes [#106](http://github.com/aurelia/router/issues/106))
* **navigation-plan:** handle redirects in child router configs ([52349014](http://github.com/aurelia/router/commit/52349014bfa75e3a05563bbf8d42a40c4a49437e), closes [#103](http://github.com/aurelia/router/issues/103))
* **package:**
  * change jspm directories ([bb51cacb](http://github.com/aurelia/router/commit/bb51cacbf7ec66323d97e6982abed9de1563fcf5))
  * update dependencies ([01e5adac](http://github.com/aurelia/router/commit/01e5adac3839646e797289512c6fe97299b51f59))
  * update deps and fix bower semver ranges ([35b65594](http://github.com/aurelia/router/commit/35b65594b39f02c41214f1d81a45d7ae92101b36))
  * update dependencies ([3c143634](http://github.com/aurelia/router/commit/3c143634a09119819af089fb8efc9b93bfbb25e1))
  * update Aurelia dependencies ([3e8dac3d](http://github.com/aurelia/router/commit/3e8dac3d3e0f80939ee25ae935f0db4f054f448a))
  * update dependencies to latest versions ([87391cc4](http://github.com/aurelia/router/commit/87391cc4706e12b0256b40cb8e19fcb59fadf0c9))
  * added missing es6-shim polyfill ([8d295197](http://github.com/aurelia/router/commit/8d295197310c6a8662b84e58fe7c011d49098d33))
* **pipeline:** fix bug preventing errors in pipeline steps from being handled ([6ee2eb87](http://github.com/aurelia/router/commit/6ee2eb87a8607981794cb02981b94c9e21e6ebc2), closes [#85](http://github.com/aurelia/router/issues/85))
* **route-loading:**
  * fix typo in error message ([6a623111](http://github.com/aurelia/router/commit/6a623111b1e91d165cbcb4dc7cbd3f89b5bca4e9))
  * prevent infinite loading with referenced routers ([943c02ba](http://github.com/aurelia/router/commit/943c02ba386110789c6290e2c9357b45131125d8))
  * use correct rejection callback ([74799a2e](http://github.com/aurelia/router/commit/74799a2e991d114070ad06c7320fe6dc8088635a))
* **router:**
  * promise missing type param ([289cfdf9](http://github.com/aurelia/router/commit/289cfdf906054a6ee0735d1abde73ea60ee75336))
  * properly handle async router configurations ([ada26d31](http://github.com/aurelia/router/commit/ada26d3151707f2150b6e2c58e61fbcd3941c3f1), closes [#213](http://github.com/aurelia/router/issues/213))
  * reset configuration promise in reset() ([a65100e9](http://github.com/aurelia/router/commit/a65100e9120a2637a02e2a41b6f4a8b2911d769d), closes [#189](http://github.com/aurelia/router/issues/189))
  * check if href property in route table exists in refreshNavigation ([d624152d](http://github.com/aurelia/router/commit/d624152d3fe710d6cec5866d30dc9a7d525b0943))
  * Use correct import for core-js We were previously using `import core from core-j ([a4dba7bd](http://github.com/aurelia/router/commit/a4dba7bddd219ebb91b5fff0bd0fdd23bc68cceb))
  * clarify error message when generating unknown route ([9d0dcd0c](http://github.com/aurelia/router/commit/9d0dcd0cf5eccc754f69b057d99b0197776fa411))
  * a route with path '/' breaks handleUnknownRoutes ([adf30dc6](http://github.com/aurelia/router/commit/adf30dc69af871939df43d2bbaf028b1e343335e), closes [#116](http://github.com/aurelia/router/issues/116))
  * use replaceState when restoring previous locations following nav errors ([55196072](http://github.com/aurelia/router/commit/5519607286874efc896625cd5855217b995cfede))
  * include querystring when restoring previous router location ([2183ab24](http://github.com/aurelia/router/commit/2183ab249b94f4df05c6e058d9c7a77be01c4519))
  * fix problems with absolute path normalization ([b49d2ddd](http://github.com/aurelia/router/commit/b49d2ddd68cda71dfd7b0c8eb7ab58a25a1f5f69), closes [#111](http://github.com/aurelia/router/issues/111))
  * considering wildcard when comparing route parameter values and using strict equa ([f809626a](http://github.com/aurelia/router/commit/f809626a03bc1bbbb3d7b4f0de073c9c33153a1f))
  * incorrectly comparing routes parameter values in navigation plan ([7c962066](http://github.com/aurelia/router/commit/7c9620669a0410946266ec1c3631554a53d8d335))
  * handle navigating to the empty string in a child router ([8f0b8fdc](http://github.com/aurelia/router/commit/8f0b8fdc45e7f4418852cbb0e8fcb99877154703), closes [#99](http://github.com/aurelia/router/issues/99))
  * export NavigationContext ([1bc53fd6](http://github.com/aurelia/router/commit/1bc53fd6a9efe6092a7b81b390bfb44be0136fc7))
  * correctly handle absolute URLs when navigating ([df1633cd](http://github.com/aurelia/router/commit/df1633cddeeae401ef56b63bcc71d8dd2f41a4a0), closes [#92](http://github.com/aurelia/router/issues/92))
  * using navigationStrategy throws a validation error ([80eb22f0](http://github.com/aurelia/router/commit/80eb22f036b1483d4b0705126b1ba3de5783872f))
  * regression in redirect due to incorrect route config validation ([f12af2e3](http://github.com/aurelia/router/commit/f12af2e357d4a8d63a2394061e6f547cb5c2beae))
  * add basic route config validation ([87741b2c](http://github.com/aurelia/router/commit/87741b2cb164ad407a23aa98db1519224b27e005))
  * require dynamic routes to specify href when adding to navigation ([c95be190](http://github.com/aurelia/router/commit/c95be19015f9949435a770872ddc434582bff90d), closes [#59](http://github.com/aurelia/router/issues/59))
  * do not interpret as child router if not configured ([18e52d85](http://github.com/aurelia/router/commit/18e52d85821ac04946f7fbf99bad8167219929f8), closes [#34](http://github.com/aurelia/router/issues/34))
  * canActivate = false doesn't change back route ([80b219cc](http://github.com/aurelia/router/commit/80b219cc81c5e3d0c82dc35745aafcd2910f9214))
  * link click handler not triggering when clicking on a nested element inside an an ([a08ee477](http://github.com/aurelia/router/commit/a08ee477177773fee0e6845b0eeb183cd238793c))
  * url fragments duplicated on subsequent navigations between routes when using pus ([021e7410](http://github.com/aurelia/router/commit/021e741009830df963ffa465f0b2ebc0b2b43c30))
  * get queryParams route-recognizer results ([37308a6d](http://github.com/aurelia/router/commit/37308a6d768f648cb6fba405fe958ad2a17c1ad2))
  * export navigation strategies ([b1959c71](http://github.com/aurelia/router/commit/b1959c719f74862cbd114279133cbef3e1616c2a))
  * do not add routes with nav=false ([2cda7eb8](http://github.com/aurelia/router/commit/2cda7eb84ac16f4bbbd23c3f7ae6f2a0ce44312e))
  * per-route view data added ([48cd118d](http://github.com/aurelia/router/commit/48cd118d1c286d02ef0cff09726bfd71ddb1b1e5))
  * enable async configureRouter for app-level router ([576b869f](http://github.com/aurelia/router/commit/576b869fdad14549847adc15c3c4c2d27e6cf0ad))
  * correct push state href generation ([9116d50e](http://github.com/aurelia/router/commit/9116d50ec1143b4c185ad5a03ba06a525ea1e5a3))
  * add missing config data for dynamic routing scenarios ([fca4ad57](http://github.com/aurelia/router/commit/fca4ad57a88c24a70277918db6b89d06e58104da))
  * empty paths for unknown routes now match ([fda55889](http://github.com/aurelia/router/commit/fda55889c56e82c6622a8846072244469330e4db))
  * switch router to using path lib ([a89f4289](http://github.com/aurelia/router/commit/a89f4289ca4d2c5f7e05cd8b42d143e44b9bdd9c))
* **shouldContinue:** typo change value to output ([1f023a16](http://github.com/aurelia/router/commit/1f023a1614b85782f1840c57005c3fd85e29dfc6))
* **test:** incorrect import statements in specs ([33cf4bae](http://github.com/aurelia/router/commit/33cf4bae931e87dda25cebec1a6badd64a04a2d5))
* **tests:** fix typo in test description ([f09f1c7b](http://github.com/aurelia/router/commit/f09f1c7bcd970de4eb5acdb3a6e91935e9bd4528))


#### Features

* **NavigationInstruction:** merge params and queryParams into a single argument to activate and canActivate ([8aecba85](http://github.com/aurelia/router/commit/8aecba85aca57a35cbc1836bcd558039e54f543c), closes [#74](http://github.com/aurelia/router/issues/74))
* **activation:** remove support for string affirmations from activation ([48182863](http://github.com/aurelia/router/commit/48182863b920d09a6d02c791f80853c6ccce9f34))
* **all:**
  * integrate pal ([87c0d8ca](http://github.com/aurelia/router/commit/87c0d8cad3efc0bfbe06812f66fa67447e667d2b))
  * new router configuration strategy ([f7aff29b](http://github.com/aurelia/router/commit/f7aff29beec45966847fdedcc4de1968fe3cf7cf))
* **app-router:** refactor navigation events to be more consistent ([90358136](http://github.com/aurelia/router/commit/90358136324f4bfac8a76dcc12b13abdef796395), closes [#97](http://github.com/aurelia/router/issues/97))
* **build:** update compile, switch to register modules, switch to core-js ([ce6abe32](http://github.com/aurelia/router/commit/ce6abe3261eb01c1604d746aec256a80536bfb57))
* **docs:**
  * generate api.json from .d.ts file ([80b2a132](http://github.com/aurelia/router/commit/80b2a132e03d6e0d7b4760078923ab55efcd5287))
  * generate api.json from .d.ts file ([070c9a17](http://github.com/aurelia/router/commit/070c9a1798b12a2f9a56835b027e9cb385b8e19a))
  * generate api.json from .d.ts file ([a9650133](http://github.com/aurelia/router/commit/a9650133908134a3c65af332daed4cf0cdebc3e3))
* **nav-model:** allow title to be set at any time by an active navModel ([5ac335d2](http://github.com/aurelia/router/commit/5ac335d2a8ec908f58c0e879ef61572e18f2b214), closes [#69](http://github.com/aurelia/router/issues/69))
* **navigation-context:** custom error for missing router-views ([383bd22e](http://github.com/aurelia/router/commit/383bd22e71e865e27b34e5a2add164d5598a8d2f))
* **navigation-instruction:**
  * merge ancestor instruction params into current params ([1f274186](http://github.com/aurelia/router/commit/1f27418655a3d3ea5e43cdca76a5302f2c105331))
  * add instruction to lifecycle args ([26b890c2](http://github.com/aurelia/router/commit/26b890c237443fa644caa400da6b79a1945ae88a))
* **navigation-plan:**
  * enable configuring the activationStrategy on the route config instead of the vie ([edf87ad9](http://github.com/aurelia/router/commit/edf87ad9d9a63f9539dba312aa7bd0ea7e9b8667))
  * allow route redirects ([61cda341](http://github.com/aurelia/router/commit/61cda341fd4bc2dbbf620ccb478497ea97e016e8))
* **redirect:** enable redirect from the app router by option ([4d1a7ea8](http://github.com/aurelia/router/commit/4d1a7ea8b20ae07cc35c5add9afc8116a9fc791f), closes [#51](http://github.com/aurelia/router/issues/51))
* **route-loading:**
  * pass additional context data to the route loader ([5ac66a30](http://github.com/aurelia/router/commit/5ac66a30e2d5fc618e34bda11a5b4334712fe6e3))
  * enable async view port component creation ([da630971](http://github.com/aurelia/router/commit/da6309715a1d1340f3782dc104ff9f4c5e3bc477))
* **router:**
  * add ensureConfigured method ([14ec352c](http://github.com/aurelia/router/commit/14ec352caa9769bcd9b22267611e2f551f8c104c))
  * restore previous location after exceeding max nav attempts ([2e03ca04](http://github.com/aurelia/router/commit/2e03ca047c1241f7c4784f6413173bdebaf4ecad))
  * use aurelia/logging for error logging ([5f378c1a](http://github.com/aurelia/router/commit/5f378c1ae31ac1ca58060b3971edea60a574f11a))
  * fail navigations after attempting to execute more than 10 instructions ([a1b1c43e](http://github.com/aurelia/router/commit/a1b1c43ecb83e227deb15447b1eaf783359f4936), closes [#84](http://github.com/aurelia/router/issues/84))
  * add navModel.setTitle method ([2cff0e10](http://github.com/aurelia/router/commit/2cff0e10cd0ff339eedc9bcc2e1a4cd859a425c9))
  * per route config customization of the navigation instruction ([7abf47d1](http://github.com/aurelia/router/commit/7abf47d1c99a76b98d500f39d9c4c04450ee7845))
  * add convenience method for navigating to a named route ([9053fc23](http://github.com/aurelia/router/commit/9053fc2375f4a36cd44216b4a2d4fb95c35fe784))
  * support navigating to absolute paths ([a017edee](http://github.com/aurelia/router/commit/a017edee68d8bf4162d5f4e8eeaaf358b60c53d7))
  * add methods for checking if a router has a named route ([aa465649](http://github.com/aurelia/router/commit/aa465649b62776eb5d197049991033a6b344785a))
  * support generating absolute paths ([aa78cc3d](http://github.com/aurelia/router/commit/aa78cc3dbfdb257854366699f3c617aca0e340aa))
  * delegate to parent when asked to generate an unknown route ([9dd556ff](http://github.com/aurelia/router/commit/9dd556ffa2f263897e33216a67f0e7c0fec92559))
  * add lifecycle events ([4c2839d1](http://github.com/aurelia/router/commit/4c2839d123850404dc0a5256402e2c1b66aa2675))
  * Add a precommit extension point to the pipeline ([8f11bfd9](http://github.com/aurelia/router/commit/8f11bfd932d9cfb6c8466ad9299f02c73066034f))
  * add support for named pipelines ([7e9f1c71](http://github.com/aurelia/router/commit/7e9f1c71cff57398ebd10419cb970883904e097d), closes [#26](http://github.com/aurelia/router/issues/26))
  * enable dedicated user setting for route config ([9cc337d0](http://github.com/aurelia/router/commit/9cc337d0be4125c3c500c3bf95f446981dc41511), closes [#23](http://github.com/aurelia/router/issues/23))
  * delayed view loading and post-activate view strategies ([e0e991b0](http://github.com/aurelia/router/commit/e0e991b0cc96cfee9aeb5d18d06bf54ba46f8982))
  * enable asynchronous router configuration ([4c6543c7](http://github.com/aurelia/router/commit/4c6543c7ebddd485ee1a8b511ba00a08afab7c5a))
* **router-configuration:**
  * don't derive required route config properties ([08f3a81c](http://github.com/aurelia/router/commit/08f3a81c75a9e6f27b61f2458311687ecf2f6590), closes [#94](http://github.com/aurelia/router/issues/94))
  * enable pushState and other history options ([79db2e45](http://github.com/aurelia/router/commit/79db2e45acab6dc76cad0a68ba929ce21ebdf0c2))


#### Breaking Changes

* Activation code returning string values to abort
activation will need to perform their own comparison and return a
boolean

 ([48182863](http://github.com/aurelia/router/commit/48182863b920d09a6d02c791f80853c6ccce9f34))
* This is a minor breaking change to any code inspecting instruction pipeline status. To update, change uses of the property or string value `cancelled` to `canceled`.

 ([dcecd013](http://github.com/aurelia/router/commit/dcecd0136c68a28d442e04947ae36996cd7fe5e8))
* This changes the names and arguments of the events published by the router during navigation.

fixes #97

 ([90358136](http://github.com/aurelia/router/commit/90358136324f4bfac8a76dcc12b13abdef796395))
* Parent params are no longer available via the `$parent` property. Parent params can be accessed via `navigationInstruction.parentInstruction.params`. Injected `*childRoute` param is no longer available on the params object passed to `activate()`.

 ([1f274186](http://github.com/aurelia/router/commit/1f27418655a3d3ea5e43cdca76a5302f2c105331))
* This is a breaking API change that replace router's NO_CHANGE, REPLACE, and INVOKE_LIFECYCLE constants with an activationStrategy object with noChange, replace, and invokeLifecycle properties.

 ([7f10f215](http://github.com/aurelia/router/commit/7f10f215e8854a8d8f7fad4df14c79ee529ce844))
* This is a breaking API change to the `activate` and `canActivate` view model callbacks. The first two arguments representing route params and query params have been merged into a single object. The signature is now `activate(params, config, navigationInstruction)`.

fixes #74

 ([8aecba85](http://github.com/aurelia/router/commit/8aecba85aca57a35cbc1836bcd558039e54f543c))


## 0.12.0 (2015-09-04)


#### Bug Fixes

* **all:** update executionContext to bindingContext ([236db1db](http://github.com/aurelia/router/commit/236db1db949292e6d39583a4a794c3459605d3d2))
* **build:** update linting, testing and tools ([2203b887](http://github.com/aurelia/router/commit/2203b88733b2aee4c731a2e4845096bc57aacef2))
* **navigation-commands:** parameter options in constructor of Redirect class is optional ([b43af880](http://github.com/aurelia/router/commit/b43af8800c7a36fa29dc7e4a7a969eaa65e90709))
* **router:**
  * reset configuration promise in reset() ([a65100e9](http://github.com/aurelia/router/commit/a65100e9120a2637a02e2a41b6f4a8b2911d769d), closes [#189](http://github.com/aurelia/router/issues/189))
  * check if href property in route table exists in refreshNavigation ([d624152d](http://github.com/aurelia/router/commit/d624152d3fe710d6cec5866d30dc9a7d525b0943))


#### Features

* **docs:** generate api.json from .d.ts file ([80b2a132](http://github.com/aurelia/router/commit/80b2a132e03d6e0d7b4760078923ab55efcd5287))


### 0.11.0 (2015-08-14)


#### Bug Fixes

* **router:** Use correct import for core-js We were previously using `import core from core-j ([a4dba7bd](http://github.com/aurelia/router/commit/a4dba7bddd219ebb91b5fff0bd0fdd23bc68cceb))


#### Features

* **docs:**
  * generate api.json from .d.ts file ([070c9a17](http://github.com/aurelia/router/commit/070c9a1798b12a2f9a56835b027e9cb385b8e19a))
  * generate api.json from .d.ts file ([a9650133](http://github.com/aurelia/router/commit/a9650133908134a3c65af332daed4cf0cdebc3e3))
* **navigation-plan:** enable configuring the activationStrategy on the route config instead of the vie ([edf87ad9](http://github.com/aurelia/router/commit/edf87ad9d9a63f9539dba312aa7bd0ea7e9b8667))
* **route-loading:** pass additional context data to the route loader ([5ac66a30](http://github.com/aurelia/router/commit/5ac66a30e2d5fc618e34bda11a5b4334712fe6e3))
* **router:** add ensureConfigured method ([14ec352c](http://github.com/aurelia/router/commit/14ec352caa9769bcd9b22267611e2f551f8c104c))


#### Breaking Changes

* This is a minor breaking change to any code inspecting instruction pipeline status. To update, change uses of the property or string value `cancelled` to `canceled`.

 ([dcecd013](http://github.com/aurelia/router/commit/dcecd0136c68a28d442e04947ae36996cd7fe5e8))


### 0.10.4 (2015-08-05)


#### Bug Fixes

* **app-router:** previously assumed very specific component structure ([df9d089a](http://github.com/aurelia/router/commit/df9d089a77dbb10d3547ada9900959a3bb3ff909))


### 0.10.3 (2015-07-29)


#### Bug Fixes

* **route-loading:** fix typo in error message ([6a623111](http://github.com/aurelia/router/commit/6a623111b1e91d165cbcb4dc7cbd3f89b5bca4e9))
* **test:** incorrect import statements in specs ([33cf4bae](http://github.com/aurelia/router/commit/33cf4bae931e87dda25cebec1a6badd64a04a2d5))


### 0.10.2 (2015-07-13)


### 0.10.1 (2015-07-07)


#### Bug Fixes

* **app-router:** log navigation errors before attempting to restore previous location ([5c8ee83d](http://github.com/aurelia/router/commit/5c8ee83df6bffb86d58d7ab55884b639e26e8714))
* **router:** clarify error message when generating unknown route ([9d0dcd0c](http://github.com/aurelia/router/commit/9d0dcd0cf5eccc754f69b057d99b0197776fa411))


## 0.10.0 (2015-07-02)


#### Bug Fixes

* **router:**
  * a route with path '/' breaks handleUnknownRoutes ([adf30dc6](http://github.com/aurelia/router/commit/adf30dc69af871939df43d2bbaf028b1e343335e), closes [#116](http://github.com/aurelia/router/issues/116))
  * use replaceState when restoring previous locations following nav errors ([55196072](http://github.com/aurelia/router/commit/5519607286874efc896625cd5855217b995cfede))
  * include querystring when restoring previous router location ([2183ab24](http://github.com/aurelia/router/commit/2183ab249b94f4df05c6e058d9c7a77be01c4519))


#### Features

* **app-router:** refactor navigation events to be more consistent ([90358136](http://github.com/aurelia/router/commit/90358136324f4bfac8a76dcc12b13abdef796395), closes [#97](http://github.com/aurelia/router/issues/97))
* **router:**
  * restore previous location after exceeding max nav attempts ([2e03ca04](http://github.com/aurelia/router/commit/2e03ca047c1241f7c4784f6413173bdebaf4ecad))
  * use aurelia/logging for error logging ([5f378c1a](http://github.com/aurelia/router/commit/5f378c1ae31ac1ca58060b3971edea60a574f11a))
  * fail navigations after attempting to execute more than 10 instructions ([a1b1c43e](http://github.com/aurelia/router/commit/a1b1c43ecb83e227deb15447b1eaf783359f4936), closes [#84](http://github.com/aurelia/router/issues/84))


#### Breaking Changes

* This changes the names and arguments of the events published by the router during navigation.

fixes #97

 ([90358136](http://github.com/aurelia/router/commit/90358136324f4bfac8a76dcc12b13abdef796395))


## 0.9.0 (2015-06-08)


#### Bug Fixes

* **navigation:** route config href was not used in router.navigation ([ea60eef9](http://github.com/aurelia/router/commit/ea60eef9e1f70d6bc4a46475da6e9295d0bb0f41))
* **navigation-instruction:** query string causes error in child routers ([e4c6e688](http://github.com/aurelia/router/commit/e4c6e688faac329dd3d9bdf5a989d9d3870bf88d), closes [#106](http://github.com/aurelia/router/issues/106))
* **navigation-plan:** handle redirects in child router configs ([52349014](http://github.com/aurelia/router/commit/52349014bfa75e3a05563bbf8d42a40c4a49437e), closes [#103](http://github.com/aurelia/router/issues/103))
* **router:**
  * fix problems with absolute path normalization ([b49d2ddd](http://github.com/aurelia/router/commit/b49d2ddd68cda71dfd7b0c8eb7ab58a25a1f5f69), closes [#111](http://github.com/aurelia/router/issues/111))
  * considering wildcard when comparing route parameter values and using strict equa ([f809626a](http://github.com/aurelia/router/commit/f809626a03bc1bbbb3d7b4f0de073c9c33153a1f))
  * incorrectly comparing routes parameter values in navigation plan ([7c962066](http://github.com/aurelia/router/commit/7c9620669a0410946266ec1c3631554a53d8d335))
  * handle navigating to the empty string in a child router ([8f0b8fdc](http://github.com/aurelia/router/commit/8f0b8fdc45e7f4418852cbb0e8fcb99877154703), closes [#99](http://github.com/aurelia/router/issues/99))
  * export NavigationContext ([1bc53fd6](http://github.com/aurelia/router/commit/1bc53fd6a9efe6092a7b81b390bfb44be0136fc7))


#### Features

* **nav-model:** allow title to be set at any time by an active navModel ([5ac335d2](http://github.com/aurelia/router/commit/5ac335d2a8ec908f58c0e879ef61572e18f2b214), closes [#69](http://github.com/aurelia/router/issues/69))
* **navigation-instruction:** merge ancestor instruction params into current params ([1f274186](http://github.com/aurelia/router/commit/1f27418655a3d3ea5e43cdca76a5302f2c105331))
* **router-configuration:** don't derive required route config properties ([08f3a81c](http://github.com/aurelia/router/commit/08f3a81c75a9e6f27b61f2458311687ecf2f6590), closes [#94](http://github.com/aurelia/router/issues/94))


#### Breaking Changes

* Parent params are no longer available via the `$parent` property. Parent params can be accessed via `navigationInstruction.parentInstruction.params`. Injected `*childRoute` param is no longer available on the params object passed to `activate()`.

 ([1f274186](http://github.com/aurelia/router/commit/1f27418655a3d3ea5e43cdca76a5302f2c105331))


### 0.8.1 (2015-05-09)


#### Bug Fixes

* **pipeline:** fix bug preventing errors in pipeline steps from being handled ([6ee2eb87](http://github.com/aurelia/router/commit/6ee2eb87a8607981794cb02981b94c9e21e6ebc2), closes [#85](http://github.com/aurelia/router/issues/85))
* **router:**
  * correctly handle absolute URLs when navigating ([df1633cd](http://github.com/aurelia/router/commit/df1633cddeeae401ef56b63bcc71d8dd2f41a4a0), closes [#92](http://github.com/aurelia/router/issues/92))
  * using navigationStrategy throws a validation error ([80eb22f0](http://github.com/aurelia/router/commit/80eb22f036b1483d4b0705126b1ba3de5783872f))


## 0.8.0 (2015-04-30)


#### Bug Fixes

* **app-router:** handle non-promise return values from configureRouter ([f2709d60](http://github.com/aurelia/router/commit/f2709d603ac3c92487371a5bad871a53768e9f17))
* **tests:** fix typo in test description ([f09f1c7b](http://github.com/aurelia/router/commit/f09f1c7bcd970de4eb5acdb3a6e91935e9bd4528))


#### Features

* **NavigationInstruction:** merge params and queryParams into a single argument to activate and canActivate ([8aecba85](http://github.com/aurelia/router/commit/8aecba85aca57a35cbc1836bcd558039e54f543c), closes [#74](http://github.com/aurelia/router/issues/74))
* **all:** new router configuration strategy ([f7aff29b](http://github.com/aurelia/router/commit/f7aff29beec45966847fdedcc4de1968fe3cf7cf))
* **router:**
  * add navModel.setTitle method ([2cff0e10](http://github.com/aurelia/router/commit/2cff0e10cd0ff339eedc9bcc2e1a4cd859a425c9))
  * per route config customization of the navigation instruction ([7abf47d1](http://github.com/aurelia/router/commit/7abf47d1c99a76b98d500f39d9c4c04450ee7845))
  * add convenience method for navigating to a named route ([9053fc23](http://github.com/aurelia/router/commit/9053fc2375f4a36cd44216b4a2d4fb95c35fe784))
  * support navigating to absolute paths ([a017edee](http://github.com/aurelia/router/commit/a017edee68d8bf4162d5f4e8eeaaf358b60c53d7))


#### Breaking Changes

* This is a breaking API change that replace router's NO_CHANGE, REPLACE, and INVOKE_LIFECYCLE constants with an activationStrategy object with noChange, replace, and invokeLifecycle properties.

 ([7f10f215](http://github.com/aurelia/router/commit/7f10f215e8854a8d8f7fad4df14c79ee529ce844))
* This is a breaking API change to the `activate` and `canActivate` view model callbacks. The first two arguments representing route params and query params have been merged into a single object. The signature is now `activate(params, config, navigationInstruction)`.

fixes #74

 ([8aecba85](http://github.com/aurelia/router/commit/8aecba85aca57a35cbc1836bcd558039e54f543c))


### 0.7.2 (2015-04-11)


#### Bug Fixes

* **router:** regression in redirect due to incorrect route config validation ([f12af2e3](http://github.com/aurelia/router/commit/f12af2e357d4a8d63a2394061e6f547cb5c2beae))


### 0.7.1 (2015-04-09)


#### Bug Fixes

* **bower:** bad version number ([42c065a3](http://github.com/aurelia/router/commit/42c065a34b1e1c3b39546a5a9d7d32cfd6f3df2d))


## 0.7.0 (2015-04-09)


#### Bug Fixes

* **all:** update compiler, core-js and pipeline ([f86d6dbc](http://github.com/aurelia/router/commit/f86d6dbcad8d2293f3e2c49bed0246a4963a0cf4))
* **app-router:** throw a more helpful error when a pipeline step fails to return a result ([0f1eda20](http://github.com/aurelia/router/commit/0f1eda20d7e0df7d4472af8946b21a2d75ff3857))
* **router:**
  * add basic route config validation ([87741b2c](http://github.com/aurelia/router/commit/87741b2cb164ad407a23aa98db1519224b27e005))
  * require dynamic routes to specify href when adding to navigation ([c95be190](http://github.com/aurelia/router/commit/c95be19015f9949435a770872ddc434582bff90d), closes [#59](http://github.com/aurelia/router/issues/59))
* **shouldContinue:** typo change value to output ([1f023a16](http://github.com/aurelia/router/commit/1f023a1614b85782f1840c57005c3fd85e29dfc6))


#### Features

* **router:**
  * add methods for checking if a router has a named route ([aa465649](http://github.com/aurelia/router/commit/aa465649b62776eb5d197049991033a6b344785a))
  * support generating absolute paths ([aa78cc3d](http://github.com/aurelia/router/commit/aa78cc3dbfdb257854366699f3c617aca0e340aa))
  * delegate to parent when asked to generate an unknown route ([9dd556ff](http://github.com/aurelia/router/commit/9dd556ffa2f263897e33216a67f0e7c0fec92559))


## 0.6.0 (2015-03-25)


#### Bug Fixes

* **navigation-command:** add explicit interface for commands interested in child routers ([1e1c4d3b](http://github.com/aurelia/router/commit/1e1c4d3b0389ad3725051a4c04c2482ea595eac1))
* **router:** do not interpret as child router if not configured ([18e52d85](http://github.com/aurelia/router/commit/18e52d85821ac04946f7fbf99bad8167219929f8), closes [#34](http://github.com/aurelia/router/issues/34))


#### Features

* **redirect:** enable redirect from the app router by option ([4d1a7ea8](http://github.com/aurelia/router/commit/4d1a7ea8b20ae07cc35c5add9afc8116a9fc791f), closes [#51](http://github.com/aurelia/router/issues/51))


### 0.5.8 (2015-02-28)


#### Bug Fixes

* **package:** change jspm directories ([bb51cacb](http://github.com/aurelia/router/commit/bb51cacbf7ec66323d97e6982abed9de1563fcf5))


### 0.5.7 (2015-02-28)


#### Bug Fixes

* **navigation-context:** navigation result not returned ([2890bfde](http://github.com/aurelia/router/commit/2890bfdeec182f4ff274e84f0429f58af37b61bb))
* **package:** update dependencies ([01e5adac](http://github.com/aurelia/router/commit/01e5adac3839646e797289512c6fe97299b51f59))


#### Features

* **navigation-instruction:** add instruction to lifecycle args ([26b890c2](http://github.com/aurelia/router/commit/26b890c237443fa644caa400da6b79a1945ae88a))
* **router:**
  * add lifecycle events ([4c2839d1](http://github.com/aurelia/router/commit/4c2839d123850404dc0a5256402e2c1b66aa2675))
  * Add a precommit extension point to the pipeline ([8f11bfd9](http://github.com/aurelia/router/commit/8f11bfd932d9cfb6c8466ad9299f02c73066034f))


### 0.5.6 (2015-02-18)


#### Bug Fixes

* **build:** add missing bower bump ([8fab77de](http://github.com/aurelia/router/commit/8fab77ded0f490aee8bc3689313b462edb97206b))


#### Features

* **navigation-plan:** allow route redirects ([61cda341](http://github.com/aurelia/router/commit/61cda341fd4bc2dbbf620ccb478497ea97e016e8))
* **router:** add support for named pipelines ([7e9f1c71](http://github.com/aurelia/router/commit/7e9f1c71cff57398ebd10419cb970883904e097d), closes [#26](http://github.com/aurelia/router/issues/26))


### 0.5.5 (2015-02-06)


#### Features

* **router:** enable dedicated user setting for route config ([9cc337d0](http://github.com/aurelia/router/commit/9cc337d0be4125c3c500c3bf95f446981dc41511), closes [#23](http://github.com/aurelia/router/issues/23))


### 0.5.4 (2015-02-03)


#### Bug Fixes

* **router:**
  * canActivate = false doesn't change back route ([80b219cc](http://github.com/aurelia/router/commit/80b219cc81c5e3d0c82dc35745aafcd2910f9214))
  * link click handler not triggering when clicking on a nested element inside an an ([a08ee477](http://github.com/aurelia/router/commit/a08ee477177773fee0e6845b0eeb183cd238793c))


### 0.5.3 (2015-01-30)


#### Bug Fixes

* **router:** url fragments duplicated on subsequent navigations between routes when using pus ([021e7410](http://github.com/aurelia/router/commit/021e741009830df963ffa465f0b2ebc0b2b43c30))


### 0.5.2 (2015-01-29)


#### Bug Fixes

* **router:** get queryParams route-recognizer results ([37308a6d](http://github.com/aurelia/router/commit/37308a6d768f648cb6fba405fe958ad2a17c1ad2))


#### Features

* **router-configuration:** enable pushState and other history options ([79db2e45](http://github.com/aurelia/router/commit/79db2e45acab6dc76cad0a68ba929ce21ebdf0c2))


### 0.5.1 (2015-01-24)


#### Bug Fixes

* **package:** update deps and fix bower semver ranges ([35b65594](http://github.com/aurelia/router/commit/35b65594b39f02c41214f1d81a45d7ae92101b36))


## 0.5.0 (2015-01-22)


#### Bug Fixes

* **package:** update dependencies ([3c143634](http://github.com/aurelia/router/commit/3c143634a09119819af089fb8efc9b93bfbb25e1))
* **route-loading:** prevent infinite loading with referenced routers ([943c02ba](http://github.com/aurelia/router/commit/943c02ba386110789c6290e2c9357b45131125d8))
* **router:**
  * export navigation strategies ([b1959c71](http://github.com/aurelia/router/commit/b1959c719f74862cbd114279133cbef3e1616c2a))
  * do not add routes with nav=false ([2cda7eb8](http://github.com/aurelia/router/commit/2cda7eb84ac16f4bbbd23c3f7ae6f2a0ce44312e))


### 0.4.2 (2015-01-12)


#### Bug Fixes

* **app-router:** catch pipeline processing errors ([36f20a6e](http://github.com/aurelia/router/commit/36f20a6e163de29fd532dcdf5f7428cda9171278))
* **package:** update Aurelia dependencies ([3e8dac3d](http://github.com/aurelia/router/commit/3e8dac3d3e0f80939ee25ae935f0db4f054f448a))
* **router:** per-route view data added ([48cd118d](http://github.com/aurelia/router/commit/48cd118d1c286d02ef0cff09726bfd71ddb1b1e5))


#### Features

* **navigation-context:** custom error for missing router-views ([383bd22e](http://github.com/aurelia/router/commit/383bd22e71e865e27b34e5a2add164d5598a8d2f))


### 0.4.1 (2015-01-07)


#### Bug Fixes

* **router:** enable async configureRouter for app-level router ([576b869f](http://github.com/aurelia/router/commit/576b869fdad14549847adc15c3c4c2d27e6cf0ad))


## 0.4.0 (2015-01-07)


#### Bug Fixes

* **router:** correct push state href generation ([9116d50e](http://github.com/aurelia/router/commit/9116d50ec1143b4c185ad5a03ba06a525ea1e5a3))


#### Features

* **router:** delayed view loading and post-activate view strategies ([e0e991b0](http://github.com/aurelia/router/commit/e0e991b0cc96cfee9aeb5d18d06bf54ba46f8982))


## 0.3.0 (2015-01-06)


#### Bug Fixes

* **router:**
  * add missing config data for dynamic routing scenarios ([fca4ad57](http://github.com/aurelia/router/commit/fca4ad57a88c24a70277918db6b89d06e58104da))
  * empty paths for unknown routes now match ([fda55889](http://github.com/aurelia/router/commit/fda55889c56e82c6622a8846072244469330e4db))


#### Features

* **build:** update compile, switch to register modules, switch to core-js ([ce6abe32](http://github.com/aurelia/router/commit/ce6abe3261eb01c1604d746aec256a80536bfb57))


### 0.2.1 (2014-12-22)


#### Bug Fixes

* **route-loading:** use correct rejection callback ([74799a2e](http://github.com/aurelia/router/commit/74799a2e991d114070ad06c7320fe6dc8088635a))


## 0.2.0 (2014-12-22)


#### Bug Fixes

* **es6:** removed the custom extend helper in place of Object.assign ([308855d4](http://github.com/aurelia/router/commit/308855d41fa51a3478c12e59ce85eb873de3a16c))
* **router:** switch router to using path lib ([a89f4289](http://github.com/aurelia/router/commit/a89f4289ca4d2c5f7e05cd8b42d143e44b9bdd9c))


#### Features

* **route-loading:** enable async view port component creation ([da630971](http://github.com/aurelia/router/commit/da6309715a1d1340f3782dc104ff9f4c5e3bc477))
* **router:** enable asynchronous router configuration ([4c6543c7](http://github.com/aurelia/router/commit/4c6543c7ebddd485ee1a8b511ba00a08afab7c5a))


### 0.1.1 (2014-12-17)


#### Bug Fixes

* **package:** update dependencies to latest versions ([87391cc4](http://github.com/aurelia/router/commit/87391cc4706e12b0256b40cb8e19fcb59fadf0c9))


## 0.1.0 (2014-12-11)


#### Bug Fixes

* **package:** added missing es6-shim polyfill ([8d295197](http://github.com/aurelia/router/commit/8d295197310c6a8662b84e58fe7c011d49098d33))
