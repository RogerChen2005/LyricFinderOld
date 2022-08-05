const asar = require('asar');

const src = 'out/lyric-finder-win32-x64/resources/app';
const dest = 'out/lyric-finder-win32-x64/resources/app.asar';

asar.createPackage(src, dest);