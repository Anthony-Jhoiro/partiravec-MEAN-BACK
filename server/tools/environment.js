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
  FRONT_URL: process.env.FRONT_URL
}
