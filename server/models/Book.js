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

const bookSchema = new mongoose.Schema({
  title: String,
  mainAuthor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  coverImage: String,
  contributors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  public: {
    type: Boolean,
    default: false
  },
  created: Date,
  updated: { type: Date, default: Date.now }
});

bookSchema.methods.isMainAuthor = function (id) {
  return this.mainAuthor == id;
};

bookSchema.methods.hasAccess = function (id) {
  return this.contributors.indexOf(id) !== -1;
};

bookSchema.methods.canRead = function (id) {
  return (this.hasAccess(id) || this.public);
};


bookSchema.methods.updateTimeStamp = function () {
  this.updated = Date.now();
}

const Book = mongoose.model('Book', bookSchema, 'books');

module.exports = Book;
