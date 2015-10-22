var os = require('os');
var sinon = require('sinon');
var expect = require('chai').expect;
var PdfUtility = require('../src/thirdParty/PdfUtility');
var LangBuilder = require('../src/LangBuilder');
var EntityKey = require('../src/restOfTheCode/EntityKey');

describe('LangBuilder.buildLang()', function () {
    describe('lang.id', function () {
        it('is the language found in the pdf file', function () {

        });
        it('can be explicitly overridden', function () {
            var pdfUtility = new PdfUtility();

            var jobQueue = {
                create: function () {
                    return {
                        attempts: function () {
                            return {save: sinon.stub()}
                        }
                    }
                }
            };

            var fileSystemContext = {workingPath: os.tmpdir()};
            var langBuilder = new LangBuilder(jobQueue, fileSystemContext, pdfUtility);

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
});