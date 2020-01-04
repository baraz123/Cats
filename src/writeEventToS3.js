let AWS = require('aws-sdk');
let logger = require('log4js').getLogger();
logger.level = 'ALL';

class WriteEventToS3 {
    static setFood(newFoodTimestamp) {
        return new Promise((resolve, reject) => {
            logger.info("Started WriteEventToS3 class");
            const bucketName = process.env.S3_TIMESTAMP_STORAGE;
            const keyName = process.env.S3_FILENAME;
            const s3 = new AWS.S3();
            s3.getObject({Bucket: bucketName, Key: keyName}, function (err, data) {
                if (err) {
                    logger.error("There's no recent food in the bucket");
                    data = "1";
                }else {
                    data = data.Body.toString();
                    data = JSON.parse(data).UpdatedBucketTime;
                }
                logger.info("Received Last updated timestamp from S3");
                const content = {
                    LastBucketTime: data,
                    UpdatedBucketTime: newFoodTimestamp
                };
                s3.putObject({
                    Bucket: bucketName,
                    Key: keyName,
                    Body: JSON.stringify(content),
                    ContentType: 'text/plain'
                }, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        logger.info("Finished to write new and old timestamps: " + JSON.stringify(data));
                        return resolve(JSON.stringify(data))
                    }
                });
                logger.info("Finished WriteEventToS3 class");
            });
        });
    }
}

module.exports = WriteEventToS3;
