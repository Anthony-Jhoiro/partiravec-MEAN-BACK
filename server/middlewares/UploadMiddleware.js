// uploadMiddleware.js

const multer = require('multer');
const AWS = require("aws-sdk");
const { AMAZON_ACCESS_KEY, AMAZON_SECRET_ACCESS_KEY, IMAGE_STORAGE_MODE } = require("../tools/environment");

if (IMAGE_STORAGE_MODE === 'local') {
  const upload = multer({
    limits: {
      fileSize: 4 * 1024 * 1024,
    }
  });
  
  module.exports = {upload};
} else {


  const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
      cb(null, Date.now().toString());
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 4 * 1024 * 1024,
    }
  });



  AWS.config.update({
    accessKeyId: AMAZON_ACCESS_KEY,
    secretAccessKey: AMAZON_SECRET_ACCESS_KEY,
    region: 'eu-west-3'
  });

  const s3 = new AWS.S3();

  module.exports = { upload, s3 };

}