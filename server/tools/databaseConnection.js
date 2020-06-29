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

const mongoose = require('mongoose');
const {MONGODB_URI} = require("./environment.js");

console.log("connecting to : " + MONGODB_URI);
// Connection to mongodb database
mongoose.connect(MONGODB_URI, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });
/**
 * to handle database events
 */
const db = mongoose.connection;

/**
 * to create schema
 */
const Schema = mongoose.Schema;

/**
 * to create model (see mongoose.model)
 * @type {function(name, schema, collection, *=): Model}
 */
const makeModel = mongoose.model; //



module.exports = { Schema, makeModel, db };
