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

import {User} from '../../server/models/User';
import * as crypto from "crypto";
import {sign} from "jsonwebtoken";
import {JWT_SECRET} from "../../server/tools/environment";

export const makeUser = async (user?: {username: string; password: string; email: string}) => {
    // User infos
    if (!user)
        user = {username: "JohnnyBanana", password: "azertyuiop22", email: "jhonny.banana@mail.com"};

    // --- Create The User ---


    // Generate the salt as a 255 characters hexadecimal string
    let salt =  crypto
        .randomBytes(Math.ceil(255 / 2))
        .toString('hex')
        .slice(0, 255);

    // Hash the password
    // @ts-ignore
    const hash = crypto.createHash('sha512', salt);
    hash.update(user.password);
    const hashedPassword = hash.digest('hex');

    // Prepare the data to insert into the database
    let dbUser = new User({
        username: user.username,
        email: user.email,
        salt: salt,
        password: hashedPassword,
        created: Date.now()
    })

    // Save the user in database
    try {
        dbUser = await dbUser.save();
    } catch (e) {
        console.error("Error creating the user");
    }

    // --- Generate The Token ---
    const token = sign({id: dbUser._id}, JWT_SECRET, {expiresIn: '365d'});

    return {
        _id: dbUser._id,
        username: dbUser.username,
        email: dbUser.email,
        password: user.password,
        hashedPassword: dbUser.password,
        salt: dbUser.salt,
        created: dbUser.created,
        token: token
    };
}
