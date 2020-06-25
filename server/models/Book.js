const db = require('../tools/databaseConnection');

const bookSchema = new db.Schema({
  title: String,
  mainAuthor: {
    type: db.Schema.Types.ObjectId,
    ref: 'User'
  },
  coverImage: String,
  contributors: [{
    type: db.Schema.Types.ObjectId,
    ref: 'User'
  }],
  created: Date,
  updated: { type: Date, default: Date.now }
});

bookSchema.methods.isMainAuthor = function (id) {
  return this.mainAuthor == id;
};

bookSchema.methods.hasAccess = function (id) {
  return this.contributors.indexOf(id) !== -1;
};
bookSchema.methods.updateTimeStamp = function () {
  this.updated = Date.now();
}

const Book = db.makeModel('Book', bookSchema, 'books');

module.exports = Book;
