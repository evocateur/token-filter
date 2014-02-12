/**
Filter Ant tokens present in a stream.

@class TokenFilter
@constructor
@extends Stream.Transform
**/

module.exports = TokenFilter;

var path = require('path');
var fs = require('graceful-fs');
var extend = require('util-extend');
var properties = require('properties');

var inherits = require('util').inherits;
var Transform = require('stream').Transform;

inherits(TokenFilter, Transform);

function TokenFilter(options) {
    if (!(this instanceof TokenFilter)) {
        return new TokenFilter(options);
    }

    options = extend({
        encoding: 'utf8',
        highWaterMark: 64 * 1024,
        tokenDelimiter: '@',
        env: {}
    }, options || {});

    Transform.call(this, options);

    this._queue = []; // FIFO
    this.tokenRegex = this._createTokenRegex(options.tokenDelimiter);
    this.replaceToken = this._replaceToken.bind(this);

    if (options.context) {
        this._contextFiltered(null, options.context);
    } else {
        TokenFilter.readConfig(options, this._contextFiltered.bind(this));
    }
}

TokenFilter.readConfig = readConfig;

TokenFilter.prototype._transform = function (chunk, encoding, done) {
    if (this._passThrough) {
        // no filtering ever, just pass through
        this.push(chunk);
    }
    else if (this.context) {
        // filters consumed, may have to empty queue
        if (this._queue.length) {
            this._queue.forEach(this.filter, this);
            this._queue = [];
        }
        this.filter(chunk);
    }
    else {
        // filters not ready yet
        this._queue.push(chunk);
    }
    done();
};

TokenFilter.prototype._contextFiltered = function (err, context) {
    if (err) {
        return this.emit("error", err);
    }
    if (!context || Object.keys(context).length === 0) {
        this._passThrough = true;
    }
    this.context = context;
    this.emit("context", context);
};

TokenFilter.prototype.filter = function (chunk) {
    // stringify in case it's a Buffer
    chunk = chunk.toString(this.encoding);

    if (this.tokenRegex.test(chunk)) {
        chunk = chunk.replace(this.tokenRegex, this.replaceToken);
    }

    this.push(chunk);
};

TokenFilter.prototype._replaceToken = function (token, key) {
    if (key in this.context) {
        return this.context[key];
    }
    return token;
};

TokenFilter.prototype._createTokenRegex = function (tokenDelimiter) {
    return new RegExp(tokenDelimiter + "(\\w+)" + tokenDelimiter, "g");
};

function readConfig(options, callback) {
    var context = {};
    var filters = options.filters || [];
    var pending = filters.length;

    if (pending === 0) {
        // no point in continuing when no filters passed in
        return callback();
    }

    var readOptions = { "encoding": options.encoding || "utf8" };
    var propertyEnv = extend({
        // Very common in Ant properties
        "basedir": process.cwd()
    }, options.env || {});

    filters.forEach(function (filterFile) {
        fs.readFile(filterFile, readOptions, function (readError, data) {
            if (readError) {
                return callback(readError);
            }

            var ext = path.extname(filterFile);
            if (ext === ".properties") {
                // parse properties
                properties.parse(data, {
                    vars: propertyEnv,
                    variables: true,
                    json: true
                }, done);
            } else if (ext === ".json") {
                // parse json
                try {
                    var config = JSON.parse(data);
                    done(null, config);
                } catch (ex) {
                    done(ex);
                }
            } else {
                console.warn("Skipping invalid file extension: %s", filterFile);
                done();
            }
        });
    });

    function done(parseError, config) {
        if (parseError) {
            return callback(parseError);
        }

        extend(context, config);

        if (--pending === 0) {
            callback(null, context);
        }
    }
}
