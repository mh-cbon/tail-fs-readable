# tail-fs-readable

A readable stream to tail a file.

Works with files

- not existing yet
- deleted meanwhile
- reduced meanwhile
- appended meanwhile

# install

```sh
npm i @mh-cbon/tail-fs-readable --save
```

# Usage

```js
var tailFs = require('@mh-cbon/tail-fs-readable');

var stream = tailFs('somefile')
.on('data', function (d) {
  console.log('DATA %s', d.toString())
})
.on('end', function () {
  console.log('END')
})
.on('reached-end', function () {
  console.log('REACHED END')
})
.on('close', function () {
  console.log('CLOSE')
});

stream.pipe(process.stdout);

setTimeout(function () {
  stream.close();
}, 1500)
```

### Options

`touchToRefresh`

if `true`, `tail-fs-readable` will consider the
file as completely changed if its `mtime` is different,
but the size is identical.

if `false`, `tail-fs-readable` will not be able to detect a modified file
with a different content, but the same size.

It s about this particular case :

```sh
echo "some" > tailed.txt
echo "else" > tailed.txt
```

# As a binary

```sh
npm i @mh-cbon/tail-fs-readable -g
tailf some.txt
  ctrl+c to quit
```
