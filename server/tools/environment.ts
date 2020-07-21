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
import {config} from "dotenv";

if (process.env.ENVIRONMENT !== 'prod') {
    config();
}


export const PORT = process.env.PORT;
export const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';
export const JWT_SECRET = process.env.JWT_SECRET || "abracadabra";
export const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1/partiravec";
export const UPLOAD_FOLDER = process.env.PWD + '/upload/';
export const ENDPOINT = process.env.ENDPOINT;
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
export const FRONT_URL = process.env.FRONT_URL;
export const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY;
export const AMAZON_SECRET_ACCESS_KEY = process.env.AMAZON_SECRET_ACCESS_KEY;
export const IMAGE_STORAGE_MODE = process.env.IMAGE_STORAGE_MODE || "local";
export const GMAIL_EMAIL = process.env.GMAIL_EMAIL;
export const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;

