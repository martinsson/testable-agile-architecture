
var kue = require('kue');

/**
 * @param jobQueue kue
 * @param splitJobConfig
 * @returns {{submit: submit}}
 */
function myQueue(redisConfig, splitJobConfig) {
    var jobQueue = kue.createQueue(redisConfig);

    function submit(jobPayload) {
        jobQueue.create(splitJobConfig.queueName, jobPayload)
            .attempts(splitJobConfig.attempts)
            .save();
    }

    return {
        submit: submit
    }
}

module.exports = myQueue;