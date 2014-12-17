import {History} from 'aurelia-history';
import {Container} from 'aurelia-dependency-injection';
import {AppRouter, PipelineProvider} from '../src/index';

describe('observer locator', () => {
  it('should have some tests', () => {
    var router = new AppRouter(new History(), new PipelineProvider(new Container()));
    expect(router).not.toBe(null);
  });
});