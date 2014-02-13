/**
Filter Ant tokens present in a stream.

@class TokenFilter
@constructor
@extends Stream.Transform
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

    if (this.tokenRegex.test(chunk)) {
        chunk = chunk.replace(this.tokenRegex, this.replaceToken);
    }

    this.push(chunk);
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
