const authenticationController = require('./AuthenticationController');
const User = require('../models/User');
const Inbox = require('../models/Inbox');
const Group = require('../models/Group');
const ConnectedUser = require('./ConnectedUser')

class FriendsController {

  clients = [];

  /**
   * Add a user to the current user friends if he isn't one already and if he is not the current user
   * @param req
   * @param res
   * @bodyParam user string the user to add
   * @return {Promise<void>}
   */
  async addFriend(req, res) {
    // Get current user
    const currentUser = await User.findOne({_id: authenticationController.currentUser});
    const userToAdd = req.body.user

    if (userToAdd === authenticationController.currentUser)
      return res.status(400).json({error: "Vous ne pouvez pas vous ajouter comme ami."});

    if (currentUser.friends.indexOf(userToAdd) !== -1)
      return res.status(400).json({error: "Vous êtes déjà amis"});

    currentUser.friends.push(userToAdd);
    currentUser.save(err => {
      if (err) return res.status(400).json({error: "Il semble que vous ne puissiez pas  être ami avec cet utilisateur"});
      return res.json({success: "Vous êtes maintenant amis !"});
    });
  }

  /**
   * Remove a user from the current user friends
   * @param req
   * @param res
   * @queryParam user string id of the user to add
   * @return {Promise<*>}
   */
  async removeFriend(req, res) {
    // Get current user
    const currentUser = await User.findOne({_id: authenticationController.currentUser});
    const userToAdd = req.body.user;

    const userIndex = currentUser.friends.indexOf(userToAdd)
    if (userIndex === -1)
      return res.status(400).json({error: "Vous n'êtes pas amis"});

    currentUser.friends.splice(userIndex, 1);
    currentUser.save(err => {
      if (err) return res.status(400).json({error: "Il semble que vous soyez inséparables"});
      return res.json({success: "Vous n'êtes plus amis !"});
    });
  }

  async getFriends(req, res) {
    const currentUser = await User.findOne({_id: authenticationController.currentUser}).populate('friends', 'username');
    return res.json(currentUser.friends);
  }

  async getRooms(req, res) {
    const currentUser = authenticationController.currentUser;
    return res.json(await Group.find({contributors: currentUser}));
  }

  /**
   * Get a room details by its id if the current user has access to it
   * @param req
   * @param res
   * @return {Promise<*>}
   */
  async getRoom(req, res) {
    const currentUser = authenticationController.currentUser;
    const _group = await Group.findOne({
      _id: req.params.room,
      contributors: currentUser
    }).populate('contributors', 'username');
    if (!_group) return res.status(400).json({error: "Le groupe demandé n'existe pas."});

    const group = {
      name: _group.name,
      contributors: _group.contributors,
      _id: _group._id,
      messages:  await Inbox.find({to: _group._id})
    };

    group.messages = group.messages.map(m => {
      return {
        from: m.from == currentUser ? 'you' : m.from,
        to: m.to,
        body: m.body,
        sent: m.sent
      }
    })

    return res.json(group);
  }

  /**
   * Create a room with the current user and the other ones given in body and a name
   * @param req
   * @param res
   * @bodyParam users string[] users ids
   * @bodyParam name string name of the group
   */
  createRoom(req, res) {
    let userSet = new Set(req.body.users);
    userSet.add(authenticationController.currentUser);
    const users = Array.from(userSet);
    const group = new Group({
      name: req.body.name,
      contributors: users
    });

    group.save(err => {
      if (err) return res.json({error: "Le groupe n'a pas pu être créé"});
      return res.json({success: "Le groupe a bien été créé"});
    });
  }

  /**
   * Add a user to a room if he is not the current user or the
   * @param req
   * @param res
   * @return {Promise<*>}
   */
  async inviteToRoom(req, res) {
    const currentUser = authenticationController.currentUser;
    const room = await Group.findOne(req.body.room);

    if (!room.hasAccess(currentUser))
      return res.status(401).json({error: "Vous ne pouvez pas ajouter d'utilisateur à ce groupe"});

    if (!(room.hasAccess(req.body.user) || req.body.user === currentUser))
      return res.status(401).json({error: "L'utilisateur fait déjà parti du groupe"});

    room.contributors.push(req.body.user);

    room.save(err => {
      if (err) return res.status(400).json({error: "Impossible d'ajouter l'utilisateur au groupe."});
      return res.json({success: "L'utilisateur a bien été ajouté au groupe."});
    });
  }

  onConnection(socket, data) {
    const user = new ConnectedUser(socket);
    this.clients.push(user);
    // process.stdout.write('\x1Bc');
    // process.stdout.write('Connected users : ' + this.clients.length);

    return user;
  }


  clientDisconnected(client) {
    this.clients.splice(this.clients.indexOf(client), 1);
    // process.stdout.write('\x1Bc');
    // process.stdout.write('Connected users : ' + this.clients.length);
  }

}

const friendsController = new FriendsController();

module.exports = friendsController;
