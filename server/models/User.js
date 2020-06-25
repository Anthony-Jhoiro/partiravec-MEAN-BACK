const db = require('../tools/databaseConnection');

const userSchema = new db.Schema({
  username: String,
  salt: String,
  password: String,
  email: String,
  profilePicture: String,
  created: Date,
  friends: [{
    type: db.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  updated: { type: Date, default: Date.now }
});



const User = db.makeModel('User', userSchema, 'users');

module.exports = User;
