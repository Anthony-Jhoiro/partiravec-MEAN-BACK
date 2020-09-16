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

import {Book} from '../models/Book';
import {Page} from '../models/Page';
import {Image} from '../models/Image';
import {ENDPOINT} from '../tools/environment';
import {CustomRequest} from "../tools/types";
import {Response} from "express";
import {Expo} from 'expo-server-sdk';

class AdminController {

    async setImageOwning(req: CustomRequest, res: Response) {
        const books = await Book.find();
        let images = [];


        // set coverImages
        books.forEach(b => {
            if (!b.coverImage.includes(ENDPOINT)) return;
            const image = new Image({
                url: b.coverImage.split('/').pop(),
                book: b,
                role: 'book'
            });
            images.push(image);

        });

        // set pages images
        const pages = await Page.find();
        pages.forEach(p => {
            p.images.forEach(i => {
                if (!i.includes(ENDPOINT)) return;

                const image = new Image({
                    url: i.split('/').pop(),
                    book: p.book,
                    role: 'book'
                })
                images.push(image);
            })
        });


        // create the images
        Image.create(images, err => {
            if (err) return res.status(500).json({error: err});
            return res.json({success: `done ${images.length} items`});
        });
    }

    // @requireAuth()
    // @requireInQuery('a', 'b', 'c')
    // @requireInBody('a', 'b', 'c')
    defaultRoute(req, res) {
        res.json({Hello: " World !"});
    }

    testNotifications(req: CustomRequest, res: Response) {
        const expo = new Expo();

        let messages = [];
        let pushToken = req.body.token;

        if (!Expo.isExpoPushToken(pushToken)) {
            return res.json({error: `Push token ${pushToken} is not a valid Expo push token`});
        }

        // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
        messages.push({
            to: pushToken,
            sound: 'default',
            body: 'This is a test notification',
            data: {withSome: 'data'},
        });

        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        setTimeout(async () => {

            for (let chunk of chunks) {
                try {
                    let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    console.log(ticketChunk);
                    tickets.push(...ticketChunk);
                } catch(error) {
                    return res.json({error: error})
                }
            }
        }, 5000);

    }
}

export const adminController = new AdminController();
