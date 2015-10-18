/**
 * Created by johan on 26/06/15.
 * Update by f.marisa on 06/07/15.
 */
var _ = require('lodash');
var fs = require('fs-extra-promise');
var path = require('path');
var pdfUtility = require('beevirtua-pdf-utility');
var Promise = require('bluebird');
var nodeUuid = require('node-uuid');

var FaceService = require('./face/FaceService');

var debug = require('debug')('LangPostService');

function LangPostService(jobQueue, fileSystemContext) {
    this.queue = jobQueue;
    this.workingPath = fileSystemContext.workingPath;
    this.splitJobConfig = {
        queueName: 'job-split-pdf',
        attempts: 5
    };
}

LangPostService.prototype.postLang = function (parentEntityKey, pdfAbsolutePath, forcedLangId) {
    var self = this;
    var lang = {
        id: undefined,
        displayMode: 'biplan',
        face: []

    };
    return pdfUtility.getPdfInfo(pdfAbsolutePath).then(function (pdfInfo) {
        lang.id = defineLang(forcedLangId, pdfInfo);

        lang.face = buildFaces(pdfInfo);

        var jobsPayload = buildDataForSplitJob(parentEntityKey, lang, pdfAbsolutePath);

        return Promise.map(jobsPayload, function (jobPayload) {
            return new Promise(function (resolve, reject) {
                var job = self.queue.create(self.splitJobConfig.queueName, jobPayload)
                    .attempts(self.splitJobConfig.attempts)
                    .save(function (err) {
                        if (!err) {
                            resolve(job.id);
                        } else {
                            reject(err);
                        }
                    });
            });
        })
    });
};


function buildFaces(pdfInfo) {
    return _.times(pdfInfo.numberOfPages, function () {
        var faceService = new FaceService(repository);
        return faceService.buildFace({
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
function buildDataForSplitJob(parentEntityKey, lang, pdfAbsolutePath) {
    var langEntityKey = parentEntityKey.append('lang', lang.id);
    var faces = lang.face;
    var faceRoutes = faces.map(function (face) {
        return [langEntityKey.directory(), 'face', face.id].join('/');
    });
    var bvIds = langEntityKey.directory().split('/');
    var jobTitle = [bvIds[2], bvIds[4], bvIds[6]].join('_');
    var jobsPayload = [{
        title: jobTitle,
        originalFilepath: pdfAbsolutePath,
        faceRoutes: faceRoutes,
        startSplit: 1,
    }];
    return jobsPayload;
}
module.exports = LangPostService;
