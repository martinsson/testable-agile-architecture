var _ = require('lodash');
var PdfUtility = require('./thirdParty/PdfUtility');
var nodeUuid = require('node-uuid');

var Face = require('./restOfTheCode/Face');


function LangBuilder(jobQueue, fileSystemContext, pdfUtility) {
    this.queue = jobQueue;
    this.workingPath = fileSystemContext.workingPath;
    this.pdfUtility = pdfUtility
    this.splitJobConfig = {
        queueName: 'job-split-pdf',
        attempts: 5
    };
}

LangBuilder.prototype.buildLang = function (parentEntityKey, pdfAbsolutePath, forcedLangId) {
    var pdfInfo = this.pdfUtility.getPdfInfo(pdfAbsolutePath);
    var langId = defineLang(forcedLangId, pdfInfo);
    var faces = buildFaces(pdfInfo);

    var lang = {
        id: langId,
        displayMode: 'portrait',
        face: faces
    };

    var langEntityKey = parentEntityKey.append('lang', langId);

    var jobPayload = buildDataForSplitJob(langEntityKey, faces, pdfAbsolutePath);
    this.queue.create(this.splitJobConfig.queueName, jobPayload)
        .attempts(this.splitJobConfig.attempts)
        .save();

    return lang;
};


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
