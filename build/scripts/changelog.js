const fs = require('fs');
const paths = require('../paths');
const path = require('path');
const conventionalChangelog = require('conventional-changelog');
const dest = path.resolve(process.cwd(), paths.doc, 'CHANGELOG.md');

let changelogChunk = '';
const changelogStream = conventionalChangelog({ preset: 'angular' })
  .on('data', chunk => changelogChunk += chunk.toString('utf8'))
  .on('end', () => {
    changelogStream.removeAllListeners();
    const data = fs.readFileSync(dest, 'utf-8');
    const fd = fs.openSync(dest, 'w+');
    fs.writeSync(fd, Buffer.from(changelogChunk, 'utf8'), 0, changelogChunk.length, 0);
    fs.writeSync(fd, Buffer.from(data, 'utf8'), 0, data.length, changelogChunk.length);
  });
