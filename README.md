# token-filter

A Transform stream that replaces delimited keys (tokens) with matching values, like the Ant Filter task.

[![Build Status](https://travis-ci.org/evocateur/token-filter.png?branch=master)](https://travis-ci.org/evocateur/token-filter)

## Usage

```js
var fs = require('fs');
var tokenFilter = require('token-filter');

// input.txt => "Hello, @name@!"
fs.createReadStream('input.txt')
    .pipe(tokenFilter({ name: "World" }))
    .pipe(fs.createWriteStream('output.txt'));
// output.txt => "Hello, World!"
```

## API

### `tokenFilter(context, [options])`

* `context` {Object} Values to interpolate into matched keys.
* `options` {Object} (optional)
  * `tokenDelimiter` {String} The string that begins and ends a token (default "@").
  * `highWaterMark` {Number} The stream's highWaterMark, defaulting to fs.ReadStream's default (64KB).

Additional stream options are detailed in the [core manual](http://nodejs.org/api/stream.html).
