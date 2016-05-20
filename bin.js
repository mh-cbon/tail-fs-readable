#!/usr/bin/env node

var tailFsreadable = require('./index.js');
var file = process.argv[2];

var tailFs = tailFsreadable(file)
tailFs.pipe(process.stdout);

process.on('SIGINT', function () {
  tailFs.close();
})
