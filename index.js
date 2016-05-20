var miss    = require('mississippi');
var fs      = require('fs');
var pkg     = require('./package.json')
var debug   = require('debug')(pkg.name);

var tailFsReadable = function (fPath, opts) {
  opts = opts || {touchToRefresh: !true};
  var stats = {
    pos: 0,
    size: 0,
    mtime: 0,
    pending: null
  }
  var statInterval = setInterval(function () {
    fs.stat(fPath, function (err, s) {
      var wasReduced = false;
      var wasModified = false;
      var wasDeleted = false;
      if (err) wasDeleted = true;
      if (wasDeleted) {
        debug('wasDeleted')
        stats.pos = 0;
        stats.size = 0;
      } else if (s.size<stats.size) {
        debug('wasReduced')
         // the file was reduced, somehow
        stats.pos = 0;
        wasReduced = true;
      } else if (opts.touchToRefresh && s.size===stats.size && s.mtime.getTime()!==stats.mtime) {
        debug('wasModified')
         // the file was modified in place
        wasModified = true;
       stats.pos = 0;
      }
      if (s) stats.mtime = s.mtime.getTime(); // if the file was deleted, s is undefined
      if (wasReduced || wasModified || s && stats.size!==s.size) {
        debug('stats.size from %s to %s', stats.size, s.size)
        stats.size = s.size;
        execPending();
      }
    })
  }, 500);
  var execPending = function (shouldClose) {
    debug('clearing interval %s', !!shouldClose)
    if(shouldClose) clearInterval(statInterval);
    if (stats.pending) {
      var p = stats.pending;
      stats.pending = null;
      p(shouldClose);
    }
  }
  var getANewBuffer = function (desiredSize, done) {
    var delta = stats.size-stats.pos;
    var toRead = delta < desiredSize ? delta : desiredSize;
    debug('========= toRead %s start.pos %s', toRead, stats.pos);
    var buf = Buffer.alloc ? Buffer.alloc(toRead) : new Buffer(toRead);
    var blen = 0;
    fs.createReadStream(fPath, {start: stats.pos-1, end: stats.pos-1+toRead})
    .on('error', function (voidErr) {
      done && done(voidErr);
      done = null;
    })
    .on('data', function (d) {
      d.copy(buf, blen, 0, d.length);
      blen += d.length;
    })
    .on('end', function () {
      done && done(null, buf);
      done = null;
    })
  }

  var read = function(size, next) {
    debug('========= %s %s %s', size, stats.pos , stats.size);
    var fnPullPush = function (shouldClose) {
      if (shouldClose) return next(null, null);
      getANewBuffer(size, function (err, buf) {
        if (err) return debug(err);
        stats.pos+=buf.length;
        next(null, buf);
      })
    }
    if (stats.pos<stats.size) {
      fnPullPush();
    } else {
      debug('========= add pending');
      if(stats.pending) throw 'Oh oh oh'
      stats.pending = fnPullPush;
    }
  };

  var stream = miss.from(read);

  stream.close = function () {
    debug('========= closing');
    execPending(true);
    stream.push(null);
    stream.once('end', function () {
      stream.emit('close')
    })
  }

  return stream;
}

module.exports = tailFsReadable;
