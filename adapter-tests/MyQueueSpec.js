var chai = require('chai');
var expect = chai.expect;
var kue = require('kue');

var MyQueue = require('../src/MyQueue');

function failure(errorMessage) {
    return new Error(errorMessage);
}


describe('submit', function () {
    var redisConfig = redisConf();


     it('saves the payload to queue, the receiver gets the exact same data', function (done) {
        var queueName = "test1";
        var myQueue = MyQueue(redisConfig, queueName);
        var receiver = kue.createQueue(redisConfig);

        var jobData = {id: "jobId1"};

        //When
        myQueue.submit([jobData], queueName);

        //Then
        receiver.process(queueName, function (job) {
            expect(job.data).to.deep.equal(jobData)
            done();
        });
    });

    it('only sees events of a single queuname', function (done) {

        var queueWithData = "queueWithData";
        var myQueue = MyQueue(redisConfig, queueName);
        var receiver = kue.createQueue(redisConfig);


        //When
        var jobData = {};
        myQueue.submit([jobData], queueWithData);

        //Then
        receiver.process("queueWithNothingInIt", function (job) {
            done(failure("shouldn't have gotten here"))
        });

        receiver.process(queueWithData, function (job) {
            done();
        });

    });

    it('it is fifo', function (done) {
        var queueName = "fifo";
        var myQueue = MyQueue(redisConfig, queueName);

        var firstJobData = {id: "job1"};
        var secondJobData = {id: "job2"};

        //When
        var submittedJobs = [firstJobData, secondJobData];

        myQueue.submit(submittedJobs, queueName);


        var expectedJobNumber = submittedJobs.length;
        waitForJobsToBeProcessed(expectedJobNumber, queueName)
            .then(assertJobsCameInOrder)
            .then(done);

        function assertJobsCameInOrder(receivedJobs) {
            expect(receivedJobs).to.deep.equal(submittedJobs);
        }

        //Then

    });

    it('does not matter if the reciever is started before or after the submitter', function () {

    });

    describe('upon failure', function() {

        it.skip('tries as many times as is configured', function (done) {
            var host = "192.1.99.100";
            var bogusPort = "3000000";

            var redisConfig  = {
                redis: "redis://" + host + ":" + bogusPort,
                attempts: 1
            };

            var queueName = "test attemps";
            var myQueue = MyQueue(redisConfig, queueName);
            var receiver = kue.createQueue(redisConfig);


            var jobData = {id: "job that never should be received"};

            //When
            myQueue.submit([jobData], queueName);

            receiver.process(queueName, function (job) {
                console.log(job)
                done(failure("we shouldn't have been able to connect like this"))
            })

        });

        it('tries once every second', function () {

        });
    });



    function waitForJobsToBeProcessed(expectedJobNumber, queueName) {
        return new Promise(function (resolve) {
            var receivedJobs = [];
            setInterval(receiveOneJob, 5);

            function receiveOneJob() {
                receiver.process(queueName, doOneJob);
            }

            function doOneJob(job) {
                receivedJobs.push(job.data);
                if (receivedJobs.length === expectedJobNumber) {
                    resolve(receivedJobs);
                }
            }
        });

    }
});


function redisConf() {
    //docker run -p 6379:6379 --name kue-redis -d redis redis-server --appendonly yes
    //docker-machine ip <name>
    var host = "192.168.99.100";
    var port = "6379";

    return {
        redis: "redis://" + host + ":" + port,
        attempts: 1
    };
}
