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
            messages: await Inbox.find({to: _group._id})
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
     * Get a group of type friend, with the current friend and the current user. If the group does not exists, create it.
     * @param req
     * @param res
     * @queryParam friend id of the friend
     * @return {Promise<*>}
     */
    async getRoomFromFriend(req, res) {
        if (!req.query.friend) return req.status(400);
        const friendId = req.query.friend;

        const currentUserId = authenticationController.currentUser;
        const friend = await User.find({_id: friendId});

        if (!friend) return req(404).json({error: "L'utilisateur n'existe pas"});


        const group = await Group.findOne({contributors: {$all: [friendId, currentUserId]}, type: 'FRIEND'});

        if (!group) {
            // If the group doesn't exists, create it
            let newGroup = new Group({
                contributors: [friendId, currentUserId],
                type: 'FRIEND'
            });



            newGroup.save(function (err, group) {
                if (err) return res.status(500).json({error: "Impossible de créer le groupe de discussion"});

                // this.clients.filter(client => client.userInfos.userId === friendId).forEach(u => u.socket.join(group._id));
                // this.clients.filter(client => client.userInfos.userId === currentUserId).forEach(u => u.socket.join(group._id));

                return res.json({success: "Votre groupe a été créé !", group: group});
            }.bind(this));
        } else {
            return res.json({group: group});
        }


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
