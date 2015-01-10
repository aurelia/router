import {Redirect, isNavigationCommand} from '../src/navigation-commands';

describe('isNavigaionCommand', () => {
  it('should return true for object which has a navigate method', () => {
    var nc = {
      navigate(){}
    };

    expect(isNavigationCommand(nc)).toBe(true);
  });

  it('should return false for everything that does not have a navigate method', () => {
    expect(isNavigationCommand(true)).toBe(false);
    expect(isNavigationCommand(1)).toBe(false);
    expect(isNavigationCommand({})).toBe(false);
  });
});

describe('Redirect', () => {
  it('should accept url in constructor and pass this url to passed router\'s navigate method as first parameter', () => {
    var testurl = 'http://aurelia.io/',
        redirect = new Redirect(testurl),
        mockrouter = {
          url: '',
          navigate(url) {
        	 this.url = url;
          }
        };

    expect(mockrouter.url).toBe('');

    redirect.navigate(mockrouter);

    expect(mockrouter.url).toBe(testurl);
  });
});