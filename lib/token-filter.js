/**
Filter Ant tokens present in a stream.

@class TokenFilter
@constructor
@extends Stream.Transform
@param {Object} context  Values to interpolate into matched keys.
@param {Object} [options]
    @param {String} [options.tokenDelimiter="@"]
        The string that begins and ends a token.
    @param {Number} [options.highWaterMark=64KB]
        The stream's highWaterMark, defaulting to the same size
        as fs.ReadStream's default (64 * 1024, or 64KB).
@see Stream
**/

module.exports = TokenFilter;

var inherits = require('util').inherits;
var Transform = require('stream').Transform;

inherits(TokenFilter, Transform);

function TokenFilter(context, options) {
    if (!(this instanceof TokenFilter)) {
        return new TokenFilter(context, options);
    }

    options = options || {};

    // match fs.ReadStream defaults
    options.highWaterMark = options.highWaterMark || 64 * 1024;

    this.tokenDelimiter = options.tokenDelimiter || "@";
    this.tokenRegex = this._createTokenRegex(this.tokenDelimiter);
    this.replaceToken = this._replaceToken.bind(this);

    Transform.call(this, options);

    if (context && Object.keys(context).length) {
        this.context = context;
    } else {
        // no filtering ever when no context, just pass through
        this._transform = function (chunk, encoding, done) {
            done(null, chunk);
        };
    }
}

TokenFilter.prototype._transform = function (chunk, encoding, done) {
    // chunk is always a Buffer
    chunk = chunk.toString();

    var delimIndex = chunk.indexOf(this.tokenDelimiter);
    if (delimIndex > -1) {
        // partial token found previously
        if (this._tokenFragment) {
            // prepend fragment to chunk for testing
            chunk = this._tokenFragment + chunk;
            delete this._tokenFragment;
        }

        // test for full matches (beginToken + key + endToken)
        if (this.tokenRegex.test(chunk)) {
            chunk = chunk.replace(this.tokenRegex, this.replaceToken);
        } else {
            // didn't find a full match, store the fragment
            // for testing with the next chunk
            this._tokenFragment = chunk.slice(delimIndex);

            // emit stuff before the first token
            chunk = chunk.slice(0, delimIndex);
        }
    }

    this.push(chunk);
    done();
};

TokenFilter.prototype._flush = function (done) {
    if (this._tokenFragment) {
        this.push(this._tokenFragment);
        delete this._tokenFragment;
    }
    done();
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
