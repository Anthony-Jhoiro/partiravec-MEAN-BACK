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

const nodemailer = require('nodemailer');
const {GMAIL_EMAIL, GMAIL_PASSWORD} = require('../tools/environment');

class MailController {
    testMail(req, res) {


        let transporter;


            transporter =
                nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true,
                    auth: {
                        user: GMAIL_EMAIL,
                        pass: GMAIL_PASSWORD
                    }
                });



        const mailOptions = {

            from: GMAIL_EMAIL,

            to: 'anthony.quere@lacatholille.fr',
            subject: 'Sending Email using Node.js',
            text:
                'That was easy!'
        };

        transporter.sendMail(mailOptions,
            function (error) {
                if (error) {
                    console.log(error);
                    return res.status(500).json({error: "envoie du mail impossible"})
                } else {
                    return res.json({success: "email envoyé"})
                }
            });

    }
}

const mailController = new MailController();

module.exports = mailController;
