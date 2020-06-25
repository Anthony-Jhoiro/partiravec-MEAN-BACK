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
