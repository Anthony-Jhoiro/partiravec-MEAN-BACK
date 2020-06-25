const db = require('../tools/databaseConnection');

const pagesSchema = new db.Schema({
  mainAuthor: {
    type: db.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastAuthor: {
    type: db.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: String,
  content: String,
  location: {
    type: {
      label: String,
      lat: Number,
      lng: Number,
      Country: Number
    }
  },
  images: [String],
  book: {
    type: db.Schema.ObjectId,
    ref: 'Book'
  },
  created: Date,
  updated: { type: Date, default: Date.now }
});

pagesSchema.methods.isMainAuthor = function(id) {
  return this.mainAuthor == id;
};

const Page = db.makeModel('Page', pagesSchema, 'pages');

module.exports = Page;
