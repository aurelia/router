/// <reference path="./types.d.ts" />
import fs from 'fs';
import path from 'path';
import conventionalChangelog from 'conventional-changelog';

const BASE_DIR = process.cwd();
const DOC_DIR = 'doc';
const DOC_NAME = 'CHANGELOG.md';
const DEST_PATH = path.resolve(BASE_DIR, DOC_DIR, DOC_NAME);

let changelogChunk = '';
const changelogStream = conventionalChangelog({ preset: 'angular' })
  .on('data', (chunk: any) => changelogChunk += chunk.toString('utf8'))
  .on('end', () => {
    changelogStream.removeAllListeners();
    const data = fs.readFileSync(DEST_PATH, 'utf-8');
    const fd = fs.openSync(DEST_PATH, 'w+');
    fs.writeSync(fd, Buffer.from(changelogChunk, 'utf8'), 0, changelogChunk.length, 0);
    fs.writeSync(fd, Buffer.from(data, 'utf8'), 0, data.length, changelogChunk.length);
  });
