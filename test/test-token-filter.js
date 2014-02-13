/*global describe, it, before, beforeEach, after, afterEach, should, sinon */

var Transform = require("stream").Transform;
var TokenFilter = require("../");

describe("TokenFilter", function () {
    describe("instantiation", function () {
        it("should be a subclass of stream.Transform", function () {
            (new TokenFilter()).should.be.instanceOf(Transform);
        });
        it("should initialize properties", function () {
            var instance = new TokenFilter();
            instance.should.have.property("tokenRegex").that.is.an.instanceOf(RegExp);
            instance.should.have.property("replaceToken").that.is.a("function");
        });
        it("should work as a factory", function () {
            var instance;
            should.not.throw(function () {
                // jshint newcap:false
                instance = TokenFilter();
            });
            instance.should.be.instanceOf(TokenFilter);
        });
    });
    describe("context", function () {
        describe("when absent", function () {
            it("should replace implementation with PassThrough equivalent", function () {
                var instance = new TokenFilter();
                instance.should.not.have.property("context");
                instance._transform.should.not.equal(TokenFilter.prototype._transform);
            });
        });
        describe("when present", function () {
            var context = {
                "foo": "bar"
            };
            it("should store context in property via direct reference", function () {
                var instance = new TokenFilter(context);
                instance.should.have.property("context").that.deep.equals(context);
                // context is not cloned, it is a direct reference
                instance.context.should.equal(context);
            });
            it("should retain prototype implementation", function () {
                var instance = new TokenFilter(context);
                instance._transform.should.equal(TokenFilter.prototype._transform);
            });
        });
    });
    describe("processing", function () {
        it("does not modify stream when no tokens configured", function (done) {
            var instance = new TokenFilter({});
            instance.on("readable", function () {
                var chunk = instance.read();
                if (chunk) {
                    chunk.toString().should.equal("Hello, @city@!");
                }
            });
            instance.end("Hello, @city@!", done);
        });
        it("does not modify stream when no tokens present", function (done) {
            var instance = new TokenFilter({ "city": "Toledo" });
            instance.on("readable", function () {
                var chunk = instance.read();
                if (chunk) {
                    chunk.toString().should.equal("Hello, Detroit!");
                }
            });
            instance.end("Hello, Detroit!", done);
        });
        it("does not modify stream when no tokens matched", function (done) {
            var instance = new TokenFilter({ "city": "Poughkeepsie" });
            instance.on("readable", function () {
                var chunk = instance.read();
                if (chunk) {
                    chunk.toString().should.equal("Hello, @starship@!");
                }
            });
            instance.end("Hello, @starship@!", done);
        });
        it("replaces matching tokens in stream", function (done) {
            var instance = new TokenFilter({ "city": "Des Moines" });
            instance.on("readable", function () {
                var chunk = instance.read();
                if (chunk) {
                    chunk.toString().should.equal("Hello, Des Moines!");
                }
            });
            instance.end("Hello, @city@!", done);
        });
        it("replaces custom tokens in stream", function (done) {
            var instance = new TokenFilter({ "city": "Medicine Hat" }, {
                tokenDelimiter: "__"
            });
            instance.on("readable", function () {
                var chunk = instance.read();
                if (chunk) {
                    chunk.toString().should.equal("Hello, Medicine Hat!");
                }
            });
            instance.end("Hello, __city__!", done);
        });
        it("replaces tokens when encoding set", function (done) {
            var instance = new TokenFilter({ "city": "Omaha" }, {
                encoding: "utf8"
            });
            instance.on("readable", function () {
                var chunk = instance.read();
                if (chunk) {
                    chunk.toString().should.equal("Hello, Omaha!");
                }
            });
            instance.end("Hello, @city@!", done);
        });
        it("replaces matching tokens in stream across chunks");
    });
});
