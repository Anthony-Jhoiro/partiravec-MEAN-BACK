const Resize = require("../tools/Resize");
const {UPLOAD_FOLDER} = require("../tools/environment");


class ImagesController {

  async uploadImage(req, res) {
    const fileUpload = new Resize();
    if (!req.file) {
      res.status(401).json({error: 'Aucune image n\'a été trouvée'});
    }
    const filename = await fileUpload.save(req.file.buffer);
    return res.status(200).json({ name: filename });
  }

  getImage(req, res) {
    const imageName = req.params.image;
    return res.sendFile(UPLOAD_FOLDER+imageName);
  }
}
const imagesController = new ImagesController();

module.exports = imagesController;

