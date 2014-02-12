# token-filter

A Transform stream that replaces delimited keys (tokens) with matching values, like the Ant Filter task.

[![Build Status](https://travis-ci.org/evocateur/token-filter.png?branch=master)](https://travis-ci.org/evocateur/token-filter)

## Usage

```js
var TokenFilter = require('token-filter');
var fs = require('fs');

// input.txt => "Hello, @name@!"
var input  = fs.createReadStream('input.txt');
var output = fs.createWriteStream('output.txt');
var filter = new TokenFilter({
    context: {
        name: "World"
    }
});

input.pipe(filter).pipe(output);
// output.txt => "Hello, World!"
```
