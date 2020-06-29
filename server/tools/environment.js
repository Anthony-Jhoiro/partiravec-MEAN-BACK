if (process.env.ENVIRONMENT !== 'prod') {
  require('dotenv').config();
}

module.exports = {
  PORT: process.env.PORT,
  ENVIRONMENT: process.env.ENVIRONMENT | 'dev',
  JWT_SECRET: process.env.JWT_SECRET,
  MONGODB_URI: process.env.MONGODB_URI,
  UPLOAD_FOLDER: process.env.PWD + '/upload/',
  ENDPOINT: process.env.ENDPOINT,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  FRONT_URL: process.env.FRONT_URL,
  AMAZON_ACCESS_KEY: process.env.AMAZON_ACCESS_KEY,
  AMAZON_SECRET_ACCESS_KEY: process.env.AMAZON_SECRET_ACCESS_KEY,
  IMAGE_STORAGE_MODE: process.env.IMAGE_STORAGE_MODE,
}
