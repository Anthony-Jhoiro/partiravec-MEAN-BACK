const User = require('../models/User');
const authenticationController = require('../controllers/AuthenticationController');

class UserController {

  async getUsersByName(req, res) {
    const searchItem = req.query.searchItem;

    return res.json(await User.find(
      {
        username: {$regex: searchItem, $options: 'i'},
        _id: {$ne: authenticationController.currentUser}
      }, {username: 1, _id: 1})).limit(5);
  }
}

const userController = new UserController();

module.exports = userController;
