export function createPipelineState() {
  let nextResult = null;
  let cancelResult = null;

  let next = () => {
    nextResult = true;
    return Promise.resolve(nextResult);
  };

  next.cancel = (rejection) => {
    cancelResult = rejection || 'cancel';
    return Promise.resolve(cancelResult);
  };

  return {
    next,
    get result() { return nextResult; },
    get rejection() { return cancelResult; }
  };
}
