let logger = require('log4js').getLogger();
logger.level = 'ALL';
const nodeMailer = require("nodemailer");
let AWS = require('aws-sdk');
AWS.config.update({region: "us-east-1"});

const subjectMessage = "Cat's Status Message";
const backToNormal = "The cat has been fed again, back to normal status";
const warning = "The cat hasn't fed for at least 15 min";
const bucketTimeLimit = 15;
const bucketTimeWarningAlertMax = 16;
const s3 = new AWS.S3();
let updatedTime = 1;
let lastUpdatedTime = 1;

module.exports.status_check = () => {
    logger.info("Cat status function has started");
        // Converted it to async/await syntax just to simplify.
        s3.getObject({
            Bucket: process.env.S3_TIMESTAMP_STORAGE,
            Key: process.env.S3_FILENAME
        }).promise().then(results => {
                if (results !== null && results !== undefined) {
                    results = results.Body.toString();
                    updatedTime = JSON.parse(results).UpdatedBucketTime;
                    lastUpdatedTime = JSON.parse(results).LastBucketTime;
                }
                let bucketTimeMilli = (new Date().getTime()) - updatedTime;
                let lastBucketTimeMilli = (new Date().getTime()) - lastUpdatedTime;
                // Measures the diff between the current time and the last time the cat was fed
                let bucketTimeMin = Math.floor(bucketTimeMilli / 60000);
                let lastBucketTimeMin = Math.floor(lastBucketTimeMilli / 60000);
                logger.info("current: " + bucketTimeMin);
                logger.info("Last: " + lastBucketTimeMin);
                if (bucketTimeMin >= bucketTimeLimit && bucketTimeMin < bucketTimeWarningAlertMax) {
                    logger.info("The cat is hungry!! please feed him");
                    emailSystem(warning);
                } else if (bucketTimeMin < bucketTimeLimit) {
                    logger.info("The Cat isn't hungry now");
                    if (bucketTimeMin === 0 && lastBucketTimeMin >= bucketTimeLimit) {
                        logger.info("The cat had eaten");
                        logger.info("sending a recovery email");
                        emailSystem(backToNormal);
                    }
                }
            }
        ).catch(error => {
                if (error.statusCode === 404){
                    logger.error("There's no food in the bucket");
                }
            }
        );
};

function emailSystem(status) {
    let transporter = nodeMailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    let mailOptions = {
        from: process.env.SEND_FROM_EMAIL,
        to: process.env.SEND_TO_EMAIL,
        subject: subjectMessage,
        text: `${status}`
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            logger.error(error);
        } else {
            logger.info("Email sent: " + info.response);
        }
    });
}
