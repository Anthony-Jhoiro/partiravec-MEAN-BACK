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
import app from '../app';
import {makeUser} from './utils/makeUser';
import {makeBook} from "./utils/makeBook";
import {REQUEST_TOKEN_HEADER} from "../server/tools/constants";
import {Book} from "../server/models/Book";


describe("Test the book controller", () => {
    // const user = makeUser(app);

    it("You should implement this tests", done => {
        expect(44).toBe(44);
        done();
    });

    describe("Test the book creation controller", () => {
        test("A book should be created if the request is correct", async done => {
            const user = await makeUser();
            return request(app)
                .post("/api/book")
                .set(REQUEST_TOKEN_HEADER, user.token) // User is connected
                .send( {title: "Jhonny Banana Stories", coverImage: "https://picsum.photos/200"})
                .then(response => {
                    expect(response.statusCode).toBe(200);
                    done();
                });
        });
        test("The user can not create book if he is not connected", done => {
            return request(app)
                .post("/api/book", {title: "Jhonny Banana Stories", coverImage: "https://picsum.photos/200"})
                .then(response => {
                    expect(response.statusCode).toBe(403);
                    done();
                });
        });
    });

    describe("Test the book modification", () => {
        test("User can modify a book if he is connected and is the main author", async done => {
            const book = await makeBook();
            await request(app)
                .patch("/api/book/"+book._id)
                .set(REQUEST_TOKEN_HEADER, book.mainAuthor.token)
                .send({title: book.title + '_updated', coverImage: book.coverImage + '_updated'})
                .then(response => {
                    expect(response.statusCode).toBe(200);
                });
            const modifyBook = await Book.findOne({_id: book._id});

            expect(modifyBook.title).toBe(book.title + '_updated');
            expect(modifyBook.coverImage).toBe(book.coverImage + '_updated');
            done();
        });

        test("User can not modify a book if he is not connected", async done => {
            const book = await makeBook();
            await request(app)
                .patch("/api/book/"+book._id)
                .send({title: book.title + '_updated', coverImage: book.coverImage + '_updated'})
                .then(response => {
                    expect(response.statusCode).toBe(403);
                    done();
                });
        });

        test("User can modify a book if he is connected and is a contributor", async done => {
            const user = await makeUser({username: "user_contributor", password: "password_contributor", email: "email@contributor.com" });
            const book = await makeBook({title: "c_title", coverImage: "c_image", public: false, contributors: [user._id]});

            await request(app)
                .patch("/api/book/"+book._id)
                .set(REQUEST_TOKEN_HEADER, user.token)
                .send({title: book.title + '_updated', coverImage: book.coverImage + '_updated'})
                .then(response => {
                    expect(response.statusCode).toBe(200);
                });
            const modifyBook = await Book.findOne({_id: book._id});

            expect(modifyBook.title).toBe(book.title + '_updated');
            expect(modifyBook.coverImage).toBe(book.coverImage + '_updated');
            done();
        });

        test("User can not modify a book if he is connected but not a contributor", async done => {
            const user = await makeUser({username: "user_not_contributor", password: "password_not_contributor", email: "email_not@contributor.com" });
            const book = await makeBook();

            await request(app)
                .patch("/api/book/"+book._id)
                .set(REQUEST_TOKEN_HEADER, user.token)
                .send({title: book.title + '_updated', coverImage: book.coverImage + '_updated'})
                .then(response => {
                    expect(response.statusCode).toBe(401);
                    done();
                });
        });
    });

});
