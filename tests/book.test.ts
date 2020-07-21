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

import * as request from 'supertest';
import * as mongoose from 'mongoose';
import app from '../app';
import {User} from '../server/models/User';
import {makeUser} from './utils/makeUser';

// beforeAll(async () => {
//     const url = `mongodb://127.0.0.1/partiravectest`
//     await mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true})
// });

// // Cleans up database between each test
// beforeEach(async () => {
//     await User.deleteMany();
// });


describe("Test the book controller", () => {
    // const user = makeUser(app);

    test("You should implement this tests", done => {
        expect(44).toBe(44);
        done();
    });

    // user.then(user => {
    //
    //     describe("Test the book creation controller", () => {
    //         test("A book should be created if the request is correct", done => {
    //             return request(app)
    //                 .post("/api/book", {title: "Jhonny Banana Stories", coverImage: "https://picsum.photos/200"})
    //                 .then(response => {
    //                     expect(response.statusCode).toBe(200);
    //                     done();
    //                 });
    //         });
    //         test("The user can not create book if he is not connected", done => {
    //             return request(app)
    //                 .post("/api/book", {title: "Jhonny Banana Stories", coverImage: "https://picsum.photos/200"})
    //                 .then(response => {
    //                     expect(response.statusCode).toBe(403);
    //                     done();
    //                 });
    //         });
    //     });
    // });

});
