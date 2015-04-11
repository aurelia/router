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

