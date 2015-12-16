
var _ = require('lodash');
var PdfUtility = require('./thirdParty/PdfUtility');
var nodeUuid = require('node-uuid');

var Face = require('./restOfTheCode/Face');


function LangBuilder(kue, redisconfig, pdfUtility) {
    var splitJobConfig = {
        queueName: 'job-split-pdf',
        attempts: 5
    };
    var queue = kue.createQueue(redisconfig);

    function submitBackgroundJob(parentEntityKey, lang, pdfAbsolutePath) {
        var langEntityKey = parentEntityKey.append('lang', lang.id);
        var jobPayload = buildDataForSplitJob(langEntityKey, lang.face, pdfAbsolutePath);
        queue.create(splitJobConfig.queueName, jobPayload)
            .attempts(splitJobConfig.attempts)
            .save();
    }

    return {
        buildLang: function (parentEntityKey, pdfAbsolutePath, forcedLangId) {

            var lang = makeLang(pdfAbsolutePath, forcedLangId);

            submitBackgroundJob(parentEntityKey, lang, pdfAbsolutePath);

            return lang;
        }
    };

    function makeLang(pdfAbsolutePath, forcedLangId) {
        var pdfInfo = pdfUtility.getPdfInfo(pdfAbsolutePath);
        var langId = defineLang(forcedLangId, pdfInfo);
        var faces = buildFaces(pdfInfo);

        var lang = {
            id: langId,
            displayMode: 'portrait',
            face: faces
        };
        return lang;
    }
}


function buildFaces(pdfInfo) {
    return _.times(pdfInfo.numberOfPages, function () {
        return Face.buildFace({
            id: nodeUuid.v1(),
            dimensions: {
                width: pdfInfo.width,
                height: pdfInfo.height
            }
        });
    });
}

function defineLang(forcedLangId, pdfInfo) {
    var langId;
    if (forcedLangId) {
        langId = forcedLangId;
    } else if (pdfInfo.lang) {
        langId = pdfInfo.lang;
    } else {
        langId = 'fr';
    }
    return langId;
}

function buildDataForSplitJob(langEntityKey, faces, pdfAbsolutePath) {
    var callbackRoutes = faces.map(function (face) {
        return [langEntityKey.directory(), 'face', face.id].join('/');
    });
    var jobTitle = langEntityKey.directory();
    return {
        title: jobTitle,
        originalFilepath: pdfAbsolutePath,
        faceRoutes: callbackRoutes,
        startSplit: 1
    };
}

module.exports = LangBuilder;
