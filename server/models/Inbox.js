const db = require('../tools/databaseConnection');

const messageSchema = new db.Schema({
  from: {
    type: db.Schema.Types.ObjectId,
    ref: 'Group'
  },
  to: {
    type: db.Schema.Types.ObjectId,
    ref: 'Group'
  },
  sent: {
    type: Date,
    default: Date.now
  },
  body: String
});


const Inbox = db.makeModel('Inbox', messageSchema, 'inbox');

module.exports = Inbox;
