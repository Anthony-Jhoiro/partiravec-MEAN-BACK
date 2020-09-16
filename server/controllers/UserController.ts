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

import {User} from '../models/User';
import {CustomRequest} from "../tools/types";
import {Response} from "express";
import {Book} from "../models/Book";
import {requireAuth, requireInBody} from "../tools/decorators";
import {Page} from "../models/Page";
import {Expo} from "expo-server-sdk";
import { notificationController } from './NotificationController';

class UserController {

    async getUsersByName(req: CustomRequest, res: Response) {
        const searchItem = req.query.searchItem;
        const notFriend = req.query.notFriend;
        let user;
        let idQuery: any[] = [{_id: {$ne: req.currentUserId}}]
        if (notFriend) {
            user = await User.find({_id: req.currentUserId});

            idQuery.push({_id: {$nin: user.friends}});
        }

        return res.json(await User.find(
            {
                //@ts-ignore
                username: {$regex: searchItem, $options: 'i'},
                $and: idQuery

            }, {username: 1, _id: 1}).limit(5));
    }

    @requireAuth()
    async getUserMap(req: CustomRequest, res: Response): Promise<Response> {
        let books = await Book
            .find({contributors: req.currentUserId}, {title: 1});

        let result = []
        for (let book of books) {
            const pages = await Page.find({book: book._id}, {location: 1, title: 1});
            result.push({ _id: book._id, title: book.title, pages })
        }

        return res.json(result);
    }

    /**
     * add a device id to the list of devices
     * @param req Request
     * @param res Response
     */
    @requireAuth()
    @requireInBody('deviceId')
    async addDeviceId(req: CustomRequest, res: Response) {
        const user = await User.findOne({_id: req.currentUserId});
        const deviceId = req.body.deviceId;

        // Check deviceId
        if (!Expo.isExpoPushToken(deviceId)) {
            return res.json({error: `Push token ${deviceId} is not a valid Expo push token`});
        }
        // If the device is not register, add it to the list
        if (user.devices.indexOf(deviceId) === -1) {
            user.devices.push(deviceId);
            
            user.save((err, u)=> {
                return res.json({message: 'L\'apareil a bien été enregistré'});
            })
        }
        return res.json({message: 'L\'appareil était déjà enregistré'});
    }
}

export const userController = new UserController();

