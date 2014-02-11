/*global describe, it, before, beforeEach, after, afterEach, should, sinon */

var fs = require("graceful-fs");
var Transform = require("stream").Transform;

var TokenFilter = require("../");

describe("TokenFilter", function () {
    describe("instantiation", function () {
        beforeEach(function () {
            sinon.stub(TokenFilter, "readConfig");
        });
        afterEach(function () {
            TokenFilter.readConfig.restore();
        });
        it("should be a subclass of stream.Transform", function () {
            (new TokenFilter()).should.be.instanceOf(Transform);
        });
        it("should initialize properties", function () {
            var instance = new TokenFilter();
            instance.should.have.property("tokenRegex").that.is.an.instanceOf(RegExp);
            instance.should.have.property("replaceToken").that.is.a("function");
            instance.should.have.property("_encoding", "utf8");
            instance.should.have.property("_queue").that.is.an("array");
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
    describe("#readConfig()", function () {
        beforeEach(function () {
            sinon.stub(fs, "readFile");
        });
        afterEach(function () {
            fs.readFile.restore();
        });
        it("should return callback early when no pending filters", function (done) {
            TokenFilter.readConfig({}, done);
        });
        it("should pass readError to callback", function (done) {
            var stubReadError = new Error("stubReadError");
            fs.readFile.withArgs("unreadable").yields(stubReadError);
            TokenFilter.readConfig({
                filters: ["unreadable"]
            }, function (readError) {
                should.exist(readError);
                readError.should.have.property("message", "stubReadError");
                done();
            });
        });
        it("should pass parseError to callback", function (done) {
            fs.readFile.withArgs("bad.json").yields(null, "bad.json");
            TokenFilter.readConfig({
                filters: ["bad.json"]
            }, function (parseError) {
                should.exist(parseError);
                parseError.should.be.an.instanceOf(SyntaxError);
                done();
            });
        });
        it("should warn about invalid file extension", function (done) {
            sinon.stub(console, "warn");
            fs.readFile.withArgs("invalid.cfg").yields(null, "invalid = extension");
            fs.readFile.withArgs("good.json").yields(null, '{ "good": true }');
            TokenFilter.readConfig({
                filters: ["invalid.cfg", "good.json"]
            }, function (err, context) {
                should.exist(context);
                context.should.deep.equal({ "good": true });
                console.warn.should.have.been.calledWith(
                    "Skipping invalid file extension: %s",
                    "invalid.cfg"
                );
                console.warn.restore();
                done();
            });
        });
        it("should mix multiple filters into one context", function (done) {
            fs.readFile.withArgs("good.json").yields(null, '{ "good": true }');
            fs.readFile.withArgs("good.properties").yields(null, "good = mixed");
            TokenFilter.readConfig({
                filters: ["good.json", "good.properties"]
            }, function (err, context) {
                should.not.exist(err);
                should.exist(context);
                context.should.deep.equal({ "good": "mixed" });
                done();
            });
        });
    });
    describe("context", function () {
        beforeEach(function () {
            sinon.stub(TokenFilter, "readConfig");
        });
        afterEach(function () {
            TokenFilter.readConfig.restore();
        });
        describe("when absent", function () {
            it("should call #readConfig()", function () {
                var instance = new TokenFilter();
                TokenFilter.readConfig.should.have.callCount(1);
            });
            it("should pass config and bound callback to #readConfig()", function () {
                var instance = new TokenFilter();
                TokenFilter.readConfig.should.have.been.calledWith(
                    sinon.match.object,
                    sinon.match.func
                );
            });
        });
        describe("when present", function () {
            it("immediately emits context event");
        });
        describe("after filtering", function () {
            it("should be emitted in context event", function (done) {
                TokenFilter.readConfig.yieldsAsync(null, { "foo": "bar" });
                var instance = new TokenFilter();
                instance.once("context", function (context) {
                    should.exist(context);
                    context.should.deep.equal({
                        "foo": "bar"
                    });
                    done();
                });
            });
            it("should store context in instance property", function (done) {
                TokenFilter.readConfig.yieldsAsync(null, { "foo": "bar" });
                var instance = new TokenFilter();
                instance.once("context", function (context) {
                    instance.should.have.property("context").that.deep.equals(context);
                    done();
                });
            });
            it("should set _passThrough state when context missing", function (done) {
                TokenFilter.readConfig.yieldsAsync();
                var instance = new TokenFilter();
                instance.once("context", function (context) {
                    instance.should.have.property("_passThrough").that.equals(true);
                    done();
                });
            });
            it("should set _passThrough state when context empty", function (done) {
                TokenFilter.readConfig.yieldsAsync(null, {});
                var instance = new TokenFilter();
                instance.once("context", function (context) {
                    instance.should.have.property("_passThrough").that.equals(true);
                    done();
                });
            });
            it("should emit error from readConfig()", function (done) {
                TokenFilter.readConfig.yieldsAsync("boom");
                var instance = new TokenFilter();
                instance.once("error", function (error) {
                    should.exist(error);
                    error.should.equal("boom");
                    done();
                });
            });
        });
    });
    describe("piping", function () {
        it("replaces tokens in stream");
    });
});
