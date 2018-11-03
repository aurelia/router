import { _createRootedPath, _normalizeAbsolutePath, _resolveUrl, _ensureArrayWithSingleRoutePerConfig } from '../../src/util';

describe('utilities', function Utilities__Tests() {

  beforeEach(function __setup__() {
    // setup
  });

  describe('_normalizeAbsolutePath', function _1_normalizeAbsolutePath__Tests() {
    type ITestCase = [
      /* path */ string,
      /* hasPushState */ boolean,
      /* absolute */ boolean,
      /* expected */ string
    ];
    const cases: ITestCase[] = [
      // TODO: cases
    ];
    for (const [path, hasPushState, absolute, expectedRootPath] of cases) {
      it(`creates "${expectedRootPath}" from { fragment: ${path}, hasPushState: ${hasPushState}, absolute: ${absolute} }`, () => {
        expect(_normalizeAbsolutePath(path, hasPushState, absolute)).toBe(expectedRootPath);
      });
    }
  });

  describe('_createRootedPath', function _2_createRootedPath__Tests() {
    type ITestCase = [
      /* fragment */ string,
      /* baseUrl */ string,
      /* hasPushState */ boolean,
      /* absolute */ boolean,
      /* expected */ string
    ];
    const cases: ITestCase[] = [
      // TODO: cases
      ['http://g.c', '', true, true, 'http://g.c'],
      ['https://g.c', '', true, true, 'https://g.c'],
      ['//g.c', '', true, true, '//g.c'],
      ['///g.c', '', true, true, '///g.c']
    ];
    for (const [fragment, baseUrl, hasPushState, absolute, expectedRootPath] of cases) {
      it(`creates "${expectedRootPath}" from { fragment: ${fragment}, baseUrl: "${baseUrl}", hasPushState: ${hasPushState}, absolute: ${absolute} }`, () => {
        expect(_createRootedPath(fragment, baseUrl, hasPushState, absolute)).toBe(expectedRootPath);
      });
    }
  });

  describe('_resolveUrl', function _3_resolveUrl__Tests() {
    type ITestCase = [
      /* fragment */ string,
      /* baseUrl */ string,
      /* hasPushState */ boolean,
      /* expected */ string
    ];
    const cases: ITestCase[] = [
      // TODO: cases
    ];
    for (const [fragment, baseUrl, hasPushState, expectedRootPath] of cases) {
      it(`creates "${expectedRootPath}" from { fragment: ${fragment}, baseUrl: ${baseUrl}, hasPushState: ${hasPushState} }`, () => {
        expect(_resolveUrl(fragment, baseUrl, hasPushState)).toBe(expectedRootPath);
      });
    }
  });

  describe('_ensureArrayWithSingleRoutePerConfig', function _4_ensureArrayWithSingleRoutePerConfig__Tests() {
    // tests
  });
});
