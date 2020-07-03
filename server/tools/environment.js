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

if (process.env.ENVIRONMENT !== 'prod') {
  require('dotenv').config();
}

module.exports = {
  PORT: process.env.PORT,
  ENVIRONMENT: process.env.ENVIRONMENT || 'dev',
  JWT_SECRET: process.env.JWT_SECRET || "abracadabra",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1/partiravec",
  UPLOAD_FOLDER: process.env.PWD + '/upload/',
  ENDPOINT: process.env.ENDPOINT,
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  FRONT_URL: process.env.FRONT_URL,
  AMAZON_ACCESS_KEY: process.env.AMAZON_ACCESS_KEY,
  AMAZON_SECRET_ACCESS_KEY: process.env.AMAZON_SECRET_ACCESS_KEY,
  IMAGE_STORAGE_MODE: process.env.IMAGE_STORAGE_MODE || "local",
  GMAIL_EMAIL: process.env.IMAGE_STORAGE_MODE,
  GMAIL_PASSWORD: process.env.IMAGE_STORAGE_MODE
}
