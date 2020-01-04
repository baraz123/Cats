require('dotenv').config();
const ImageAnalyser = require("./imageAnalyser");
const s3Writer = require("./writeEventToS3");
let logger = require('log4js').getLogger();
logger.level = 'ALL';

module.exports.hungry_cat = (event) => {
    //Received event that new image was uploaded to S3
    const records = event.Records;
    logger.info("Received new event from S3");
    let s3Config = null;
    if (process.env.ENV === 'dev') {
        s3Config = {
            bucket: process.env.S3_FOOD_STORAGE,
            imageName: "dev_image.jpg"
        };
    } else {
        records.map(record => {
            s3Config = {
                bucket: process.env.S3_FOOD_STORAGE,
                imageName: record.s3.object.key
            };
        });
    }
    return ImageAnalyser.getImageLabels(s3Config)
        .then(async (results) => {
            if (results.FoodMatch) {
                logger.info("According to AWS Rekognition, the image is either Milk, Bread or Fish");
                await s3Writer.setFood(results.Time);
            } else {
                logger.info("According to AWS Rekognition, The image isn't Milk, Bread or Fish");
            }
        })
        .catch(error => {
            logger.error(new Error(error));
        });
};
