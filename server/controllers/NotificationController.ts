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

import { ConnectedUser } from "./ConnectedUser";
import { Socket } from "socket.io";
import { ID } from "../tools/types";
import { User } from "../models/User";
import { Expo } from "expo-server-sdk";

class NotificationController {
  clients = [];
  onConnection(socket: Socket) {
    const user = new ConnectedUser(socket);
    this.clients.push(user);
    return user;
  }

  clientDisconnected(client) {
    for (let index in this.clients) {
      if (this.clients[index].userId === client.userId) {
        this.clients.splice(Number(index), 1);
        break;
      }
    }
  }

  async sendNotificationTo(userId: ID, body: string, data: any = {}) {
    const user = await User.findOne({ _id: userId });
    console.group("hey")
    const expo = new Expo();

    const messages = [];
    user.devices.forEach((device) => {
      messages.push({
        to: device,
        sound: "default",
        body,
        data,
      });
    });

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        throw error;
      }
    }
  }

  /**
   *
   * @param userId
   * @return {null|ConnectedUser}
   */
  getSocketFromUserId(userId: ID) {
    const user = this.clients.filter((c) => {
      return c.userInfos.userId === userId;
    });
    if (user.length > 0) {
      return user[0];
    }
    return null;
  }
}

export const notificationController = new NotificationController();
