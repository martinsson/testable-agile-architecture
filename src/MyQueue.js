/**
 * @param jobQueue kue
 * @param splitJobConfig
 * @returns {{submit: submit}}
 */
function myQueue(jobQueue, splitJobConfig) {
    return {
        submit: function(jobPayload) {
            jobQueue.create(splitJobConfig.queueName, jobPayload)
                .attempts(splitJobConfig.attempts)
                .save();

        }
    }
}

module.exports = myQueue;