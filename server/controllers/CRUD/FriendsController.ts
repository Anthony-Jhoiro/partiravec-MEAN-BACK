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

import { CustomRequest } from "../../tools/types";
import { Response } from "express";

import { User } from "../../models/User";
import { Inbox } from "../../models/Inbox";
import { Group } from "../../models/Group";
import { notificationController } from "../NotificationController";
import { FriendRequest } from "../../models/FriendRequest";
import {
  requireAuth,
  requireInBody,
  requireInQuery,
} from "../../tools/decorators";
import {
  INVALID_VALUE,
  RESOURCE_NOT_FOUND,
  SERVER_ERROR,
  UNAUTHORIZE,
  USELESS,
  USER_NOT_FOUND,
} from "../../tools/ErrorTypes";

class FriendsController {
  /**
   *
   * @deprecated not in use
   *
   * Add a user to the current user friends if he isn't one already and if he is not the current user
   *
   * @param req
   * @param res
   * @bodyParam user string the user to add
   * @return {Promise<void>}
   */
  @requireAuth()
  @requireInBody("user")
  async addFriend(req: CustomRequest, res: Response): Promise<Response> {
    // Get current user
    const currentUser = await User.findOne({ _id: req.currentUserId });
    const userToAdd = req.body.user;

    if (userToAdd === req.currentUserId)
      return res.status(400).send(INVALID_VALUE);

    if (currentUser.friends.indexOf(userToAdd) !== -1)
      return res.status(400).send(USELESS);
    currentUser.friends.push(userToAdd);
    currentUser.save((err) => {
      if (err) return res.status(500).send(SERVER_ERROR);
      return res.json({ success: "Vous êtes maintenant amis !" });
    });
  }

  /**
   * Remove a user from the current user friends
   * TODO : remove friend for the other user too
   * @param req
   * @param res
   * @queryParam user string id of the user to add
   * @return {Promise<*>}
   */
  @requireAuth()
  @requireInBody("user")
  async removeFriend(req: CustomRequest, res: Response) {
    // Get current and other user
    const userToAdd = req.body.user;
    const currentUser = await User.findOne({ _id: req.currentUserId });
    const otherUser = await User.findOne({ _id: userToAdd });

    // check users are friends
    const userIndex = currentUser.friends.indexOf(userToAdd);
    if (userIndex === -1) {
      return res.status(400).send(INVALID_VALUE);
    }

    const otherUserIndex = otherUser.friends.indexOf(req.currentUserId);

    otherUser.friends.splice(otherUserIndex, 1);
    currentUser.friends.splice(userIndex, 1);
    currentUser.save((err) => {
      if (err) return res.status(500).send(SERVER_ERROR);
      otherUser.save((err) => {
        if (err) return res.status(500).send(SERVER_ERROR);
        return res.json({ success: "success" });
      });
    });
  }

  @requireAuth()
  async getFriends(req: CustomRequest, res: Response) {
    const currentUser = await User.findOne({ _id: req.currentUserId })
      .populate({ path: "friends", select: "username picture" })
      .exec();
    return res.json(currentUser.friends);
  }

  async getRooms(req: CustomRequest, res) {
    const currentUser = req.currentUserId;
    return res.json(await Group.find({ contributors: currentUser }));
  }

  /**
   * Get a room details by its id if the current user has access to it
   * @param req
   * @param res
   * @return {Promise<*>}
   */
  @requireAuth()
  async getRoom(req: CustomRequest, res: Response) {
    const currentUser = req.currentUserId;
    const _group = await Group.findOne({
      _id: req.params.room,
      contributors: currentUser,
    }).populate("contributors", "username");
    if (!_group) return res.status(404).send(RESOURCE_NOT_FOUND);

    const group: any = {
      name: _group.name,
      contributors: _group.contributors,
      _id: _group._id,
      messages: await Inbox.find({ to: _group._id }),
    };

    group.messages = group.messages.map((m) => {
      return {
        from: m.from == currentUser ? "you" : m.from,
        to: m.to,
        body: m.body,
        sent: m.sent,
      };
    });

    return res.json(group);
  }

  /**
   * Get a group of type friend, with the current friend and the current user. If the group does not exists, create it.
   * @param req
   * @param res
   * @queryParam friend id of the friend
   * @return {Promise<*>}
   */
  @requireAuth()
  @requireInQuery("friend")
  async getRoomFromFriend(req: CustomRequest, res: Response) {
    const friendId = req.query.friend;

    const currentUserId = req.currentUserId;
    const friend = await User.find({ _id: friendId });

    if (!friend) return res.status(404).send(USER_NOT_FOUND);

    const group = await Group.findOne({
      contributors: { $all: [friendId, currentUserId] },
      type: "FRIEND",
    });

    if (!group) {
      return res.status(500).send(RESOURCE_NOT_FOUND);
    } else {
      return res.json({ group: group });
    }
  }

  /**
   * Create a room with the current user and the other ones given in body and a name
   * @param req
   * @param res
   * @bodyParam users string[] users ids
   * @bodyParam name string name of the group
   */
  @requireAuth()
  @requireInBody("users", "name")
  createRoom(req: CustomRequest, res: Response) {
    // Create a Set containing all of the users and then convert it to array
    let userSet = new Set(req.body.users);
    userSet.add(req.currentUserId);
    const users = Array.from(userSet);

    const group = new Group({
      name: req.body.name,
      contributors: users,
    });

    group.save((err, group) => {
      if (err) return res.status(500).send(SERVER_ERROR);
      return res.json(group);
    });
  }

  /**
   * Add a user to a room if he is not the current user or the
   * @param req
   * @param res
   * @return {Promise<*>}
   */
  @requireAuth()
  @requireInBody("room", "user")
  async inviteToRoom(req: CustomRequest, res: Response) {
    const currentUserId = req.currentUserId;
    const otherUserId = req.body.user;
    const room = await Group.findOne(req.body.room);

    // Check if the user can do the action
    if (!room.hasAccess(currentUserId))
      return res.status(401).send(UNAUTHORIZE);

    if (!(room.hasAccess(otherUserId) || otherUserId === currentUserId))
      return res.status(401).send(USELESS);

    room.contributors.push(otherUserId);

    room.save((err, group) => {
      if (err) return res.status(500).send(SERVER_ERROR);
      return res.json(group);
    });
  }

  /**
   * Create a friend request
   * @param req
   * @param res
   */
  @requireAuth()
  @requireInBody("friend")
  async createFriendRequest(req: CustomRequest, res: Response) {
    const currentUserId = req.currentUserId;
    const newFriendId = req.body.friend;

    // Check not friend
    const currentUser = await User.findOne({ _id: currentUserId });

    if (currentUser.friends.indexOf(newFriendId) !== -1)
      return res.status(400).send(USELESS);

    // Check for previous friends request
    const previousRequest = await FriendRequest.findOne({
      $or: [
        {
          // @ts-ignore
          from: currentUserId,
          to: newFriendId,
         
        }, // @ts-ignore
        { from: newFriendId, to: currentUserId },
      ],
    });

    if (previousRequest) return res.status(400).send(USELESS);

    // Create the request
    const request = new FriendRequest({
      from: currentUserId,
      to: newFriendId,
    });

    request.save((err, request) => {
      if (err) return res.status(500).send(SERVER_ERROR);
      const friendSocket = notificationController.getSocketFromUserId(
        newFriendId
      );

      if (friendSocket) {
        friendSocket.socket.emit(
          "friend-request",
          request.populate("from", "username")
        );
      }

      return res.json(request);
    });
  }

  /**
   * Get friends request sended to the current user
   * @param req
   * @param res
   */
  @requireAuth()
  async getFriendRequests(req: CustomRequest, res: Response) {
    const currentUser = req.currentUserId;

    const friendRequests = await FriendRequest
      // @ts-ignore
      .find({ to: currentUser })
      .populate({ path: "from", select: "username picture" })
      .exec();

    return res.json(friendRequests);
  }

  /**+
   *
   * @param req
   * @param res
   * @return {Promise<*>}
   */
  @requireAuth()
  @requireInBody("friendRequest")
  async acceptFriendRequest(req: CustomRequest, res: Response) {
    const currentUserId = req.currentUserId;
    const friendRequestId = req.body.friendRequest;

    const friendRequest = await FriendRequest.findOne({
      _id: friendRequestId,
      // @ts-ignore
      to: currentUserId,
    })
      .populate("from")
      .populate("to");

    if (!friendRequest) return res.status(404).send(RESOURCE_NOT_FOUND);

    // add to friend list
    friendRequest.to.friends.push(friendRequest.from._id);
    friendRequest.from.friends.push(currentUserId);

    friendRequest.to.save((err, to) => {
      if (err) return res.status(500).send(SERVER_ERROR);
      friendRequest.from.save((err, from) => {
        if (err) return res.status(500).send(SERVER_ERROR);

        // Create the room
        const room = new Group({
          name: from.username + "-" + to.username,
          contributors: [from, to],
          type: "FRIEND",
        });

        // Delete the friend request
        FriendRequest.deleteOne({ _id: friendRequest._id }, (err) => {
          if (err) return res.status(500).send(SERVER_ERROR);
          room.save((err, room) => {
            if (err) return res.status(500).send(SERVER_ERROR);

            // Make both users listen to that room
            const currentUserSocket = notificationController.getSocketFromUserId(
              currentUserId
            );
            if (currentUserSocket) currentUserSocket.socket.join(room._id);
            const otherOneSocket = notificationController.getSocketFromUserId(
              from._id
            );
            if (otherOneSocket) otherOneSocket.join(room._id);
          });
        });
        return res.json({ success: "Vous êtes maintenant amis !", data: room });
      });
    });
  }
}

export const friendsController = new FriendsController();
