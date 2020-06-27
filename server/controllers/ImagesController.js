const Resize = require("../tools/Resize");
const { UPLOAD_FOLDER, ENDPOINT } = require("../tools/environment");
const fs = require("fs");
const { s3 } = require("../middlewares/UploadMiddleware");


class ImagesController {

  async uploadImage(req, res) {
    fs.readFile(req.file.path, (err, filedata) => {
      if (err) console.error(err);
      const fileName = Date.now() + '.png';
      const putParams = {
        Bucket: 'partiravec',
        Key: Date.now() + '.png',
        Body: filedata
      };

      s3.putObject(putParams, (err, data) => {
        if (err) return res.status(500).json({ error: err });
        // fs.unlink(req.file.path);
        return res.json({name: ENDPOINT +"/api/images/"+ fileName});
      });


    });
    // const fileUpload = new Resize();
    // if (!req.file) {
    //   res.status(401).json({error: 'Aucune image n\'a été trouvée'});
    // }

    // const filename = await fileUpload.save(req.file.buffer);

    // return res.status(200).json({ name: filename });
  }

  getImage(req, res) {
    const imageName = req.params.image;

    const getParams = {
      Bucket: 'partiravec',
      Key: imageName
    };

    s3.getObject(getParams, (err, data) => {
      if (err) return res.status(404).json({error: "Image introuvable"});
      res.writeHead(200, {'Content-Type': 'image/jpeg'});
      res.write(data.Body, 'binary');
      res.end(null, 'binary');
    })




    // return res.sendFile(UPLOAD_FOLDER + imageName);
  }
}
const imagesController = new ImagesController();

module.exports = imagesController;

