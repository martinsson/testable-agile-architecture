/**
 * @param jobQueue kue
 * @param splitJobConfig
 * @returns {{submit: submit}}
 */
function myQueue(jobQueue, splitJobConfig) {

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