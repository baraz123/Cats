let logger = require('log4js').getLogger();
logger.level = 'ALL';
const AWS = require("aws-sdk/index");
AWS.config.update({ region: "us-east-1" });
const rek = new AWS.Rekognition();

class ImageAnalyser {
  static getImageLabels(s3Config) {
    const params = {
      Image: {
        S3Object: {
          Bucket: s3Config.bucket,
          Name: s3Config.imageName
        }
      },
      MaxLabels: 10,
      MinConfidence: 90
    };

    logger.info(
      `Analyzing file: https://s3.amazonaws.com/${s3Config.bucket}/${s3Config.imageName}`
    );

    return new Promise((resolve, reject) => {
      rek.detectLabels(params, (err, data) => {
        if (err) {
          logger.error(err);
          return reject(err);
        }
        data.Labels.forEach(function(label) {
            if (label.Name === "Fish" || label.Name === "Milk" || label.Name === "Bread"){
                    return resolve({FoodMatch: true, Time: new Date().getTime()});   
            }
        });
       
        return resolve({FoodMatch: false});
      });
    });
  }
}

module.exports = ImageAnalyser;