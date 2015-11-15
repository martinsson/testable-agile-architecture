var os = require('os');
var sinon = require('sinon');
var expect = require('chai').expect;
var PdfUtility = require('../src/thirdParty/PdfUtility');
var LangBuilder = require('../src/LangBuilder');
var EntityKey = require('../src/restOfTheCode/EntityKey');

describe('LangBuilder.buildLang()', function () {
    var pdfUtility = new PdfUtility();
    var fileSystemContext = {workingPath: os.tmpdir()};

    var parentEntityKey = EntityKey.fromPath("/region/eu");
    var pdPath = "/tmp/pdfFile.pdf";


    describe('lang.id', function () {
        it('is the language found in the pdf file', function () {

        });
        it('can be explicitly overridden', function () {

            var myQueue = {
                submit: function () {}
            };
            var langBuilder = new LangBuilder(myQueue, pdfUtility);

            var parentEntityKey = EntityKey.fromPath("/region/eu");
            var pdPath = "/tmp/pdfFile.pdf";

            var forcedLangId = "de";
            var lang = langBuilder.buildLang(parentEntityKey, pdPath, forcedLangId);

            expect(lang.id).to.equal("de");
        });
        it('is french by default', function () {

        });
    });

    describe('lang.face', function () {
        it('is a collection of pages in the pdf file', function () {

        });
        describe('every face', function () {
            it('has the width and height of the first page', function () {

            });
            it('has a unique id', function () {

            });
        })
    });

    describe('sends a splitJob to the message queue', function () {
        it('contains the path of the pdf', function() {
            var expectedPayload = {originalFilepath: pdPath};
            var myQueue = {
                submit: sinon.spy()
            };

            var langBuilder = new LangBuilder(myQueue, pdfUtility);

            langBuilder.buildLang(parentEntityKey, pdPath);

            sinon.assert.calledWith(myQueue.submit, sinon.match(expectedPayload))

        })
    })
});