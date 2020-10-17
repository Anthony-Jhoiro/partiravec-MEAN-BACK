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

import {jwtVerify} from '../tools/jwtVerify';
import {Inbox} from '../models/Inbox';
import {Group} from '../models/Group';
import {Socket} from "socket.io"
import { notificationController } from './NotificationController';
import { User } from '../models/User';

export class ConnectedUser {
    userInfos: {
        socketId: string;
        userId: string;
    };
    socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;
        this.userInfos = {socketId: socket.id, userId: null};
    }

    identify(data, next) {
        const token = data.token;
        jwtVerify(token,
            decoded => {
                this.userInfos.userId = decoded.id;
                Group.find({contributors: this.userInfos.userId})
                    .then(groups => {
                        groups.forEach(g => {
                            this.socket.join(g._id);
                        });
                        this.socket.on('message', (data, next) => this.onMessage(data, next));
                        next();
                    });

            },
            () => {
                try {
                    this.socket.emit('err', 'La connexion a échoué')
                } catch (e) {
                    console.error(e);
                }

            });
    }

    onMessage(data, next) {
        // user has access to room
        Group.findOne({_id: data.room})
            .then(group => {

                if (!group)
                    return this.socket.emit('error', "La room n'existe pas.");
                if (!group.hasAccess(this.userInfos.userId))
                    return this.socket.emit('error', "Vous n'êtes pas authorisé à écrire ici");

                const message = new Inbox({
                    from: this.userInfos.userId,
                    to: group.id,
                    body: data.message
                });

                message.save((err, message) => {
                    if (err) return this.socket.emit('error', "Impossible d'envoyer le message");
                    this.socket.broadcast.to(data.room).emit('message', {message, group});
                    User.findById(this.userInfos.userId, (err, user) => {
                        const notificationText = user.username + " : " + data.message
                        group.contributors.forEach(c => {
                            // @ts-ignore
                            notificationController.sendNotificationTo(c, notificationText, {message, roomId: group._id, type: 'message'})
                            
                        })
                    })
                    
                    next(message);
                })
            });
    }
}

