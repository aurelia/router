# aurelia-router

[![npm Version](https://img.shields.io/npm/v/aurelia-router.svg)](https://www.npmjs.com/package/aurelia-router)
[![Join the chat at https://gitter.im/aurelia/discuss](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/aurelia/discuss?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![CircleCI](https://circleci.com/gh/aurelia/router.svg?style=shield)](https://circleci.com/gh/aurelia/router)

This library is part of the [Aurelia](http://www.aurelia.io/) platform and contains a powerful client-side router. @davismj is currently the technical lead for routing.

To keep up to date on [Aurelia](http://www.aurelia.io/), please visit and subscribe to [the official blog](http://blog.aurelia.io/) and [our email list](http://eepurl.com/ces50j). We also invite you to [follow us on twitter](https://twitter.com/aureliaeffect). If you have questions look around our [Discourse forums](https://discourse.aurelia.io/), chat in our [community on Gitter](https://gitter.im/aurelia/discuss) or use [stack overflow](http://stackoverflow.com/search?q=aurelia). Documentation can be found [in our developer hub](http://aurelia.io/docs/routing).

## Platform Support

This library can be used in the **browser** only.

## Building The Code

To build the code, follow these steps.

1. Ensure that [NodeJS](http://nodejs.org/) is installed. This provides the platform on which the build tooling runs.
2. From the project folder, execute the following command:

  ```shell
  npm install
  ```
3. To build the code, you can now run:

  ```shell
  npm run build
  ```
4. You will find the compiled code in the `dist` folder, available in three module formats: AMD, CommonJS and ES6.

## Development

1. To run the project in development mode, you can run:

  ```shell
  npm start
  ```

2. If you want to copy over the newly built bundle, you can specified `--target`:

  ```
  npm start -- --target ..\my-test-project
  ```

## Running The Tests

To run the unit tests, first ensure that you have followed the steps above in order to install all dependencies and successfully build the library. Once you have done that, proceed with these additional steps:

1. Run the test script:

  ```
  npm run test
  ```

2. With watch options to rerun the test (headless):

  ```
  npm run test:watch
  ```

3. With watch options to rerun the test (with browser):

  ```
  npm run test:debugger
  ```
