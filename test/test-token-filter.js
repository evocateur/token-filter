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
        function streamReader(instance) {
            instance.on("readable", reader);
            function reader() {
                var chunk = this.read();
                while (chunk !== null) {
                    reader.result += chunk.toString();
                    chunk = this.read();
                }
            }
            reader.result = "";
            return reader;
        }
        it("does not modify stream when no tokens configured", function (done) {
            var instance = new TokenFilter({});
            var reader = streamReader(instance);
            instance.end("Hello, @city@!", function () {
                reader.result.should.equal("Hello, @city@!");
                done();
            });
        });
        it("does not modify stream when no tokens present", function (done) {
            var instance = new TokenFilter({ "city": "Toledo" });
            var reader = streamReader(instance);
            instance.end("Hello, Detroit!", function () {
                reader.result.should.equal("Hello, Detroit!");
                done();
            });
        });
        it("does not modify stream when no tokens matched", function (done) {
            var instance = new TokenFilter({ "city": "Poughkeepsie" });
            var reader = streamReader(instance);
            instance.end("Hello, @starship@!", function () {
                reader.result.should.equal("Hello, @starship@!");
                done();
            });
        });
        it("replaces matching tokens in stream", function (done) {
            var instance = new TokenFilter({ "city": "Des Moines" });
            var reader = streamReader(instance);
            instance.end("Hello, @city@!", function () {
                reader.result.should.equal("Hello, Des Moines!");
                done();
            });
        });
        it("replaces custom tokens in stream", function (done) {
            var instance = new TokenFilter({ "city": "Medicine Hat" }, {
                tokenDelimiter: "__"
            });
            var reader = streamReader(instance);
            instance.end("Hello, __city__!", function () {
                reader.result.should.equal("Hello, Medicine Hat!");
                done();
            });
        });
        it("replaces tokens when encoding set", function (done) {
            var instance = new TokenFilter({ "city": "Omaha" }, {
                encoding: "utf8"
            });
            var reader = streamReader(instance);
            instance.end("Hello, @city@!", function () {
                reader.result.should.equal("Hello, Omaha!");
                done();
            });
        });
        it("replaces matching tokens in stream across chunks", function (done) {
            var instance = new TokenFilter({ "city": "Topeka" }, {
                encoding: "utf8"
            });
            var reader = streamReader(instance);
            instance.write("Hello, @ci");
            instance.end("ty@!", function () {
                reader.result.should.equal("Hello, Topeka!");
                done();
            });
        });
        it("should allow non-matching token across chunks", function (done) {
            var instance = new TokenFilter({ "city": "Minneapolis" });
            var reader = streamReader(instance);
            instance.write("Hello, @ci");
            instance.write("ty@! ");
            instance.write("Lunch @ 12pm, ");
            instance.end("dinner @ 6pm.", function () {
                reader.result.should.equal("Hello, Minneapolis! Lunch @ 12pm, dinner @ 6pm.");
                done();
            });
        });
        it("should allow non-matching custom token across chunks", function (done) {
            var instance = new TokenFilter({ "city": "St. Paul" }, {
                tokenDelimiter: "__"
            });
            var reader = streamReader(instance);
            instance.write("Hello, __ci");
            instance.write("ty__! ");
            instance.write("You're _co");
            instance.end("ld_.", function () {
                reader.result.should.equal("Hello, St. Paul! You're _cold_.");
                done();
            });
        });
    });
});
