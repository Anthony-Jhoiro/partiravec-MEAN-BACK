const sharp = require('sharp');
const {UPLOAD_FOLDER, ENDPOINT} = require("../tools/environment");


const ReturnImageUrl = ENDPOINT+"/api/images/";

class Resize {
  async save(buffer) {
    const fileName = Date.now() + '.png';
    const filePath = UPLOAD_FOLDER + fileName;
    await sharp(buffer)
      .resize(600, 600, {
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .toFile(filePath);

    return ReturnImageUrl + fileName;
  }
}
module.exports = Resize;
