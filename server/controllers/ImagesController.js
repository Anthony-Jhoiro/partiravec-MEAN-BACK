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

const Resize = require("../tools/Resize");
const { UPLOAD_FOLDER, ENDPOINT, IMAGE_STORAGE_MODE } = require("../tools/environment");
const fs = require('fs');
const { s3 } = require("../middlewares/UploadMiddleware");

const LOCALSTORAGE = "local";


class ImagesController {

  async uploadImage(req, res) {

    if (IMAGE_STORAGE_MODE === LOCALSTORAGE) {
      const fileUpload = new Resize();
      if (!req.file) {
        res.status(401).json({ error: 'Aucune image n\'a été trouvée' });
      }

      const filename = await fileUpload.save(req.file.buffer);

      return res.status(200).json({ name: filename });

    } else {
      fs.readFile(req.file.path, (err, filedata) => {
        if (err) return res.status(500).json({ error: "L'image ne peut pas être lue." });

        const fileName = Date.now() + '.png';
        const putParams = {
          Bucket: 'partiravec',
          Key: Date.now() + '.png',
          Body: filedata
        };

        s3.putObject(putParams, (err, data) => {
          if (err) return res.status(500).json({ error: err });
          // fs.unlink(req.file.path);
          return res.json({ name: ENDPOINT + "/api/images/" + fileName });
        });


      });
    }




  }

  getImage(req, res) {
    const imageName = req.params.image;

    if (IMAGE_STORAGE_MODE === LOCALSTORAGE) {
      return res.sendFile(UPLOAD_FOLDER + imageName);
    } else {
      const getParams = {
        Bucket: 'partiravec',
        Key: imageName
      };
  
      s3.getObject(getParams, (err, data) => {
        if (err) return res.status(404).json({ error: "Image introuvable" });
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.write(data.Body, 'binary');
        res.end(null, 'binary');
      });
    }
  }
}
const imagesController = new ImagesController();

module.exports = imagesController;

