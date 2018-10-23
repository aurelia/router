import './interfaces';

Error.stackTraceLimit = Infinity;

const testContext = require.context('./unit', true, /\.spec\.ts$/im);
testContext.keys().forEach(testContext);
