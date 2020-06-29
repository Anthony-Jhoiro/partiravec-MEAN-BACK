/*
 *
 *
 * Copyright 2020 ANTHONY QUÉRÉ
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

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
