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

function LangPostService(repository, jobQueue, fileSystemContext) {
    this.repository = repository;
    this.queue = jobQueue;
    this.workingPath = fileSystemContext.workingPath;
    this.splitJobConfig = {
        queueName: 'job-split-pdf',
        attempts: 5
    };
}
LangPostService.prototype.getPdfInfo = function LangPostService_getTitle(pdfAbsolutePath) {
    return pdfUtility.getPdfInfo(pdfAbsolutePath).then(function (pdfInfo) {
        return pdfInfo;
    });
};
LangPostService.prototype.getPdfLanguage = function LangPostService_getTitle(pdfAbsolutePath) {
    return pdfUtility.getPdfLanguage(pdfAbsolutePath).then(function (language) {
        return language ? language : 'fr';
    });
};
LangPostService.prototype.postLang = function (parentEntityKey, pdfAbsolutePath, langId) {
    var self = this;
    var repository = this.repository;
    var langEntityKey;
    var lang = {
        id: undefined,
        title: undefined,
        displayMode: 'biplan',
        children: {
            face: [],
            media: []
        }
    };
    debug('POST lang(1/4) get pdfinfo: %s - %s', parentEntityKey.directory(), pdfAbsolutePath);
    return Promise.all([
        self.getPdfInfo(pdfAbsolutePath).then(function (pdfInfo) {
            lang.id = pdfInfo.lang
            lang.title = pdfInfo.title;
            lang.children.face = _.times(pdfInfo.numberOfPages, function () {
                return nodeUuid.v1();
            });
            return pdfInfo;
        })
    ]).then(function (pdfMetaData) {
        debug('POST lang(2/4) create BV doc: %s - %s - %s page(s)', parentEntityKey.directory(), lang.id, lang.children.face.length);
        langEntityKey = parentEntityKey.append('lang', lang.id);
        var faceService = new FaceService(repository);
        var pdfInfo = pdfMetaData[1];
        return Promise.map(lang.children.face, function (faceId) {
            // TODO: each face should have its own dimensions from single page PDF
            return faceService.postFace(langEntityKey, {
                id: faceId,
                dimensions: {
                    width: pdfInfo.width,
                    height: pdfInfo.height
                }
            });
        });
        debug('POST lang(4/4) create split job: %s', langEntityKey.directory());
        var faceRoutes = lang.children.face.map(function (faceId) {
            return [langEntityKey.directory(), 'face', faceId].join('/');
        });
        var bvIds = langEntityKey.directory().split('/');
        var jobTitle = [bvIds[2], bvIds[4], bvIds[6]].join('_');
        var jobsPayload = [{
            title: jobTitle,
            originalFilepath: pdfAbsolutePath,
            faceRoutes: faceRoutes,
            startSplit: 1,
            endSplit: lang.children.face.length
        }];
        return Promise.map(jobsPayload, function (jobPayload) {
            var job;
            return new Promise(function (resolve, reject) {
                job = self.queue.create(self.splitJobConfig.queueName, jobPayload)
                    .attempts(self.splitJobConfig.attempts)
                    .save(function (err) {
                        if (!err) {
                            resolve(job.id);
                        } else {
                            reject(err);
                        }
                    });
                // TODO job TTL, removeOnComplete...
            });
        })
    });
};
module.exports = LangPostService;
