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

import {createTransport} from 'nodemailer';
import {GMAIL_EMAIL, GMAIL_PASSWORD, ENVIRONMENT, JWT_SECRET, FRONT_URL} from '../tools/environment';
import {User} from "../models/User";
import {sign} from 'jsonwebtoken';
import {CustomRequest} from "../tools/types";
import {Response} from "express";

class MailController {
    async passwordMail(req: CustomRequest, res: Response) {

        let user;

        if (req.body.login.indexOf('@') !== -1) {
            user = await User.findOne({email: req.body.login});
        } else {
            user = await User.findOne({username: req.body.login});
        }
        if (!user) return res.status(400).json({error: "L'adresse email ou l'identifiant n'existe pas"});

        const code = sign({id: user.id}, JWT_SECRET, {expiresIn: '1h'});

        const url = FRONT_URL + '/home/password/receive?t=' + code;
        const destination = user.email;

        if (ENVIRONMENT === 'dev') {
            console.log("Email send to : " + destination);
            console.log("Email content : " + url);
            return res.json({success: "Un message est apparu dans les logs"});
        }

        const transporter =
            createTransport({
                service: 'gmail',
                auth: {
                    user: GMAIL_EMAIL,
                    pass: GMAIL_PASSWORD
                }
            });


        const mailOptions = {

            from: "<Partir Avec Vous> " + GMAIL_EMAIL,

            to: destination,
            subject: 'Sending Email using Node.js',
            text: url
        };

        transporter.sendMail(mailOptions,
            function (error) {
                if (error) {
                    return res.status(500).json({error: "envoie du mail impossible"})
                } else {
                    return res.json({success: "email envoyé"})
                }
            });

    }
}

export const mailController = new MailController();
