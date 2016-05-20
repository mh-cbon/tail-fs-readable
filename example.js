var tailFsreadable = require('./index.js');

var tailFs = tailFsreadable('./some.txt')
.on('data', function (d) {
  if(d.toString().match(/close/)) {
    tailFs.close();
  }
})
.on('end', function () {
  console.log('END')
})
.on('close', function () {
  console.log('CLOSE')
});

tailFs.pipe(process.stdout);
