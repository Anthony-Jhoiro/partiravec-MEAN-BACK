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
import {Types} from "mongoose";


describe("Test the book controller", () => {

    process.env.TEST_SUITE = 'book-tests';

    describe("Test the book creation controller", () => {
        test("A book should be created if the request is correct", async done => {
            const user = await makeUser();
            return request(app)
                .post("/api/book")
                .set(REQUEST_TOKEN_HEADER, user.token) // User is connected
                .send({title: "Jhonny Banana Stories", coverImage: "https://picsum.photos/200"})
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
            const newBookData = {
                title: book.title + '_updated',
                coverImage: book.coverImage + '_updated'
            }
            await request(app)
                .patch("/api/book/" + book._id)
                .set(REQUEST_TOKEN_HEADER, book.mainAuthor.token)
                .send(newBookData)
                .then(response => {
                    expect(response.statusCode).toBe(200);
                });
            const modifyBook = await Book.findOne({_id: book._id});

            expect(modifyBook.title).toBe(newBookData.title);
            expect(modifyBook.coverImage).toBe(newBookData.coverImage);
            done();
        });

        test("User can not modify a book if he is not connected", async done => {
            const book = await makeBook();
            await request(app)
                .patch("/api/book/" + book._id)
                .send({title: book.title + '_updated', coverImage: book.coverImage + '_updated'})
                .then(response => {
                    expect(response.statusCode).toBe(403);
                    done();
                });
        });

        test("User can modify a book if he is connected and is a contributor", async done => {
            const user = await makeUser({
                username: "user_contributor",
                password: "password_contributor",
                email: "email@contributor.com"
            });
            const book = await makeBook({
                contributors: [user._id]
            });

            await request(app)
                .patch("/api/book/" + book._id)
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
            const user = await makeUser();
            const book = await makeBook();

            await request(app)
                .patch("/api/book/" + book._id)
                .set(REQUEST_TOKEN_HEADER, user.token)
                .send({title: book.title + '_updated', coverImage: book.coverImage + '_updated'})
                .then(response => {
                    expect(response.statusCode).toBe(401);
                    done();
                });
        });
    });

    describe("Test the book contributors modification", () => {
        describe("User can add contributors to a book", () => {
            test("Test user can add a contributor to a book if he is already a contributor", async done => {
                const newContributor = await makeUser();
                const book = await makeBook();

                const response = await request(app)
                    .post("/api/book/access/add")
                    .set(REQUEST_TOKEN_HEADER, book.mainAuthor.token)
                    .send({book: book._id, user: newContributor._id});

                expect(response.statusCode).toBe(200);

                // get book
                const b = await Book.findOne({_id: book._id})
                expect(b.contributors)
                    .toEqual(expect.arrayContaining([Types.ObjectId(newContributor._id)]));

                done();
            });

            test("Test user can not add a contributor to a book if he is not already a contributor", async done => {
                const newContributor = await makeUser();
                const user = await makeUser();
                const book = await makeBook();

                const response = await request(app)
                    .post("/api/book/access/add")
                    .set(REQUEST_TOKEN_HEADER, user.token)
                    .send({book: book._id, user: newContributor._id});

                expect(response.statusCode).toBe(401);
                done();
            });

            test("Test user can not add a contributor to a book if he is already a contributor", async done => {
                const newContributor = await makeUser();
                const book = await makeBook({
                    contributors: [newContributor._id]
                });

                const response = await request(app)
                    .post("/api/book/access/add")
                    .set(REQUEST_TOKEN_HEADER, book.mainAuthor.token)
                    .send({book: book._id, user: newContributor._id});

                expect(response.statusCode).toBe(400);
                done();
            });
        });

        describe("User can remove contributors from a book", () => {
            test("Test user can remove a contributor from a book", async done => {
                const user = await makeUser();
                const oldContributor = await makeUser();
                const book = await makeBook({
                    contributors: [user._id, oldContributor._id],
                });

                const response = await request(app)
                    .post("/api/book/access/remove")
                    .set(REQUEST_TOKEN_HEADER, user.token)
                    .send({book: book._id, user: oldContributor._id});

                expect(response.statusCode).toBe(200);

                // get book
                const b = await Book.findOne({_id: book._id})
                expect(b.contributors)
                    .toEqual(expect.not.arrayContaining([Types.ObjectId(oldContributor._id)]));

                done();
            });

            test("Test user can not remove the main author from a book", async done => {
                const user = await makeUser();
                const book = await makeBook({
                    contributors: [user._id]
                });

                const response = await request(app)
                    .post("/api/book/access/remove")
                    .set(REQUEST_TOKEN_HEADER, user.token)
                    .send({book: book._id, user: book.mainAuthor._id});

                expect(response.statusCode).toBe(401);

                done();
            });
        });
    });

    describe("Test Visitors access", () => {
        test("Test Visitors have access to public books", async done => {
            const publicBook = await makeBook({public: true});
            const response = await request(app)
                .get('/api/book/public')

            expect(response.statusCode).toBe(200);

            expect(response.body.length > 1);

            expect(response.body)
                .toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        public: true,
                        _id: publicBook._id.toString(),
                        title: publicBook.title,
                        coverImage: publicBook.coverImage,
                        access: false
                    })
                ]));
            done();
        });

        test("Test public book request do not return private book", async done => {
            const publicBook = await makeBook({public: false});
            const response = await request(app)
                .get('/api/book/public')

            expect(response.statusCode).toBe(200);

            expect(response.body)
                .toEqual(expect.not.arrayContaining([
                    expect.objectContaining({
                        public: true,
                        _id: publicBook._id.toString(),
                        title: publicBook.title,
                        coverImage: publicBook.coverImage,
                        access: false
                    })
                ]));
            done();
        });

        test("Test Visitors don't have access to private books", async done => {
            const response = await request(app)
                .get('/api/book')

            expect(response.statusCode).toBe(403);

            done();
        });


        test("Test Visitors can read public book", async done => {
            const publicBook = await makeBook({public: true});
            const response = await request(app)
                .get('/api/book/' + publicBook._id);

            expect(response.statusCode).toBe(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    _id: publicBook._id.toString(),
                    title: publicBook.title,
                    coverImage: publicBook.coverImage,
                    access: false
                })
            );

            done();
        });

        test("Test Visitors can not read private book", async done => {
            const privateBook = await makeBook({public: false});
            const response = await request(app)
                .get('/api/book/' + privateBook._id);

            expect(response.statusCode).toBe(403);

            done();
        });
    });
});
