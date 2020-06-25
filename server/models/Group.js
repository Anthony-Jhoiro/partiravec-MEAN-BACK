const db = require('../tools/databaseConnection');

const groupSchema = new db.Schema({
  name: String,
  contributors: [{
    type: db.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

groupSchema.methods.hasAccess = function (id) {
  return this.contributors.indexOf(id) !== -1;
}


const Group = db.makeModel('Group', groupSchema, 'groups');

module.exports = Group;
