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

import {CustomRequest} from "../tools/types";
import {Response} from "express";

import {User} from '../models/User';
import {Inbox} from '../models/Inbox';
import {Group} from '../models/Group';
import {notificationController} from './NotificationController';
import {FriendRequest} from '../models/FriendRequest';
import {requireAuth} from "../tools/decorators";

class FriendsController {

    /**
     * Add a user to the current user friends if he isn't one already and if he is not the current user
     * @param req
     * @param res
     * @bodyParam user string the user to add
     * @return {Promise<void>}
     */
    async addFriend(req: CustomRequest, res: Response) {
        // Get current user
        const currentUser = await User.findOne({_id: req.currentUserId});
        const userToAdd = req.body.user

        if (userToAdd === req.currentUserId)
            return res.status(400).json({error: "Vous ne pouvez pas vous ajouter comme ami."});

        if (currentUser.friends.indexOf(userToAdd) !== -1)
            return res.status(400).json({error: "Vous êtes déjà amis"});

        currentUser.friends.push(userToAdd);
        currentUser.save(err => {
            if (err) return res.status(500).json({error: "Il semble que vous ne puissiez pas  être ami avec cet utilisateur"});
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
    async removeFriend(req: CustomRequest, res: Response) {
        // Get current user
        const currentUser = await User.findOne({_id: req.currentUserId});
        const userToAdd = req.body.user;

        const userIndex = currentUser.friends.indexOf(userToAdd)
        if (userIndex === -1)
            return res.status(400).json({error: "Vous n'êtes pas amis"});

        currentUser.friends.splice(userIndex, 1);
        currentUser.save(err => {
            if (err) return res.status(500).json({error: "Il semble que vous soyez inséparables"});
            return res.json({success: "Vous n'êtes plus amis !"});
        });
    }

    @requireAuth()
    async getFriends(req: CustomRequest, res: Response) {
        const currentUser = await User
            .findOne({_id: req.currentUserId})
            .populate({path: 'friends', select: 'username picture'})
            .exec();
        return res.json(currentUser.friends);
    }

    async getRooms(req: CustomRequest, res) {
        const currentUser = req.currentUserId;
        return res.json(await Group.find({contributors: currentUser}));
    }

    /**
     * Get a room details by its id if the current user has access to it
     * @param req
     * @param res
     * @return {Promise<*>}
     */
    async getRoom(req: CustomRequest, res: Response) {
        const currentUser = req.currentUserId;
        const _group = await Group.findOne({
            _id: req.params.room,
            contributors: currentUser
        }).populate('contributors', 'username');
        if (!_group) return res.status(404).json({error: "Le groupe demandé n'existe pas."});

        const group: any = {
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
    async getRoomFromFriend(req: CustomRequest, res: Response) {
        if (!req.query.friend) return res.status(400);
        const friendId = req.query.friend;

        const currentUserId = req.currentUserId;
        const friend = await User.find({_id: friendId});

        if (!friend) return res.status(404).json({error: "L'utilisateur n'existe pas"});


        const group = await Group.findOne({contributors: {$all: [friendId, currentUserId]}, type: 'FRIEND'});

        if (!group) {
            return res.status(500).json({error: "Groupe de discussion introuvable"});
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
    createRoom(req: CustomRequest, res: Response) {
        let userSet = new Set(req.body.users);
        userSet.add(req.currentUserId);
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
    async inviteToRoom(req: CustomRequest, res: Response) {
        const currentUser = req.currentUserId;
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

    async createFriendRequest(req: CustomRequest, res: Response) {
        // Check request
        if (!req.body.friend) return res.status(400);

        const currentUserId = req.currentUserId;
        const newFriendId = req.body.friend;

        // Check not friend
        const currentUser = await User.findOne({_id: currentUserId});

        if (currentUser.friends.indexOf(newFriendId) !== -1)
            return res.status(400).json({error: "Vous êtes déjà amis."});

        // Check for previous friends request
        const previousRequest = await FriendRequest.findOne({
            $or: [{
                // @ts-ignore
                from: currentUserId,
                to: newFriendId
                // @ts-ignore
            }, {from: newFriendId, to: currentUserId}]
        });

        if (previousRequest) return res.status(400).json({error: "Une demande d'ami a déjà été envoyée"});

        // Create the request
        const request = new FriendRequest({
            from: currentUserId,
            to: newFriendId
        });

        request.save((err, request) => {
            if (err) return res.status(500).json({error: "Envoie de la requete impossible."});
            const friendSocket = notificationController.getSocketFromUserId(newFriendId);

            if (friendSocket) {
                friendSocket.socket.emit('friend-request', request.populate('from', 'username'));
            }

            return res.json({success: "La demande d'ami a bien été envoyée !"})
        })

    }

    async getFriendRequests(req: CustomRequest, res: Response) {
        const currentUser = req.currentUserId;

        const friendRequests = await FriendRequest
            // @ts-ignore
            .find({to: currentUser})
            .populate({path: 'from', select: 'username picture'})
            .exec();

        return res.json(friendRequests);
    }

    /**+
     *
     * @param req
     * @param res
     * @return {Promise<*>}
     */
    async acceptFriendRequest(req: CustomRequest, res: Response) {
        const currentUserId = req.currentUserId;
        const friendRequestId = req.body.friendRequest;

        if (!friendRequestId) return res.status(400);

        const friendRequest = await FriendRequest.findOne({
            _id: friendRequestId,
            // @ts-ignore
            to: currentUserId
        }).populate('from').populate('to');

        if (!friendRequest) return res.status(404).json({error: "Demande d'ami introuvable."});

        // add to friend list
        friendRequest.to.friends.push(friendRequest.from._id);
        friendRequest.from.friends.push(currentUserId);

        friendRequest.to.save((err, to) => {
            if (err) return res.status(500).json({error: "Impossible de mettre à jour la liste d'ami"});
            friendRequest.from.save((err, from) => {
                if (err) return res.status(500).json({error: "Impossible de mettre à jour la liste d'ami"});

                // Create the room
                const room = new Group({
                    name: from.username + '-' + to.username,
                    contributors: [from, to],
                    type: 'FRIEND'
                });


                // Delete the friend request
                FriendRequest.deleteOne({_id: friendRequest._id}, err => {
                    if (err) return res.status(500).json({error: "Impossible de supprimer la demande d'ami"});
                    room.save((err, room) => {
                        if (err) return res.status(500).json({error: "Impossible de créer le groupe de discussion"});

                        // Make both users listen to that room
                        const currentUserSocket = notificationController.getSocketFromUserId(currentUserId);
                        if (currentUserSocket) currentUserSocket.socket.join(room._id);
                        const otherOneSocket = notificationController.getSocketFromUserId(from._id);
                        if (otherOneSocket) otherOneSocket.join(room._id);


                    });

                });
                return res.json({success: "Vous êtes maintenant amis !", data: room});

            })
        });


    }

}

export const friendsController = new FriendsController();

