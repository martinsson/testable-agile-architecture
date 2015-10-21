var _ = require('lodash');
var pdfUtility = require('pdf-utility');
var nodeUuid = require('node-uuid');

var Face = require('./face/Face');


function LangPostService(jobQueue, fileSystemContext) {
    this.queue = jobQueue;
    this.workingPath = fileSystemContext.workingPath;
    this.splitJobConfig = {
        queueName: 'job-split-pdf',
        attempts: 5
    };
}

LangPostService.prototype.postLang = function (parentEntityKey, pdfAbsolutePath, forcedLangId) {
    var pdfInfo = pdfUtility.getPdfInfo(pdfAbsolutePath);
    var langId = defineLang(forcedLangId, pdfInfo);
    var faces = buildFaces(pdfInfo);

    var lang = {
        id: langId,
        displayMode: 'portrait',
        face: faces
    };

    var langEntityKey = parentEntityKey.append('lang', langId);
    var jobPayload = buildDataForSplitJob(langEntityKey, lang, pdfAbsolutePath);


    this.queue.create(this.splitJobConfig.queueName, jobPayload)
        .attempts(this.splitJobConfig.attempts)
        .save();
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
    var faceRoutes = faces.map(function (face) {
        return [langEntityKey.directory(), 'face', face.id].join('/');
    });
    var bvIds = langEntityKey.directory().split('/');
    var jobTitle = [bvIds[2], bvIds[4], bvIds[6]].join('_');
    return {
        title: jobTitle,
        originalFilepath: pdfAbsolutePath,
        faceRoutes: faceRoutes,
        startSplit: 1
    };
}

module.exports = LangPostService;
