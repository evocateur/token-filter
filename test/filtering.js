/*global describe, it, before, beforeEach, after, afterEach, should, sinon */

var Readable = require("stream").Readable;
var TokenFilter = require("../");

describe("filtering", function () {
    describe("instantiation", function () {
        it("works as factory", function () {
            var instance;
            should.not.throw(function () {
                // jshint newcap:false
                instance = TokenFilter();
            });
            instance.should.be.instanceOf(TokenFilter);
            // sinon.stub(TokenFilter, "readConfig");
        });
    });
    describe("without context", function () {
        it("reads config from JSON file", function (done) {
            var instance = new TokenFilter({
                filters: ["test/fixtures/config.json"]
            });
            instance.on("context", function (context) {
                should.exist(context);
                context.should.deep.equal({
                    "foo": "bar"
                });
                done();
            });
        });
        it("reads config from properties file", function (done) {
            var instance = new TokenFilter({
                filters: ["test/fixtures/config.properties"]
            });
            instance.on("context", function (context) {
                should.exist(context);
                context.should.deep.equal({
                    "foo": "bar"
                });
                done();
            });
        });
        it("reads config from both file types", function (done) {
            var instance = new TokenFilter({
                filters: [
                    "test/fixtures/config.json",
                    "test/fixtures/config.properties"
                ]
            });
            instance.on("context", function (context) {
                should.exist(context);
                context.should.deep.equal({
                    "foo": "bar"
                });
                done();
            });
        });
        it("replaces tokens in stream");
    });
    describe("with context", function () {
        it("replaces tokens in stream");
    });
});
