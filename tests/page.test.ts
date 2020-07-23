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
import {makeUser} from "./utils/makeUser";
import app from "../app";
import {REQUEST_TOKEN_HEADER} from "../server/tools/constants";
import {makeBook} from "./utils/makeBook";
import {Page} from "../server/models/Page";
import {makePage} from "./utils/makePage";

describe("Test the page controller", () => {

    process.env.TEST_SUITE = 'page-tests';

    describe("Test the page creation controller", () => {
        test("Uer can create a page if connected and contributor to the book", async done => {
            const contributor = await makeUser();
            const book = await makeBook({contributors: [contributor]});
            const pageData = {
                title: "Page title",
                content: "Lorem ipsum",
                location: {lat: 0, lng: 0, label: "location label", country: "FR"},
                images: Array(5).fill("image.png")
            };

            const rep = await request(app)
                .post("/api/book/" + book._id + "/page")
                .set(REQUEST_TOKEN_HEADER, contributor.token) // User is connected
                .send(pageData);

            expect(rep.statusCode).toBe(200); // Expect the request succeed

            // Expect all the fields are fill
            const newPage = await Page.findOne();
            expect(newPage.title).toBe(pageData.title);
            expect(newPage.content).toBe(pageData.content);
            expect(newPage.location.lat).toBe(pageData.location.lat);
            expect(newPage.location.lng).toBe(pageData.location.lng);
            expect(newPage.location.label).toBe(pageData.location.label);
            expect(newPage.location.country).toBe(pageData.location.country);
            expect(newPage.images).toEqual(expect.arrayContaining(pageData.images));

            done();
        });

        test("User can not create a page if he is not a contributor", async done => {
            const notContributor = await makeUser();
            const book = await makeBook();
            const rep = await request(app)
                .post("/api/book/" + book._id + "/page")
                .set(REQUEST_TOKEN_HEADER, notContributor.token) // User is connected
                .send({
                    title: "Page title",
                    content: "Lorem ipsum",
                    location: {lat: 0, lng: 0, label: "location label", country: "FR"},
                    images: Array(5).fill("image.png")
                });

            expect(rep.statusCode).toBe(401); // Expect the request fail

            expect((await Page.find()).length).toBe(0); // Expect no pages have been created

            done();
        });
    });

    describe("Test the page modification controller", () => {
        test("Test user can modify a page if he is contributor to the book", async done => {
            const contributor = await makeUser();
            const book = await makeBook({contributors: [contributor._id]});
            const page = await makePage(book);

            const newPageData = {
                title: "new page title",
                content: "New Lorem ipsum",
                location: {lat: 2, lng: 2, label: "new location label", country: "BE"},
                images: Array(5).fill("new_image.png")
            };

            const rep = await request(app)
                .patch("/api/book/" + book._id + "/page/" + page._id)
                .set(REQUEST_TOKEN_HEADER, contributor.token) // connected as contributor
                .send(newPageData);

            expect(rep.statusCode).toBe(200); // Expect the request succeed

            // Expect all the fields are fill
            const newPage = await Page.findOne({_id: page._id});
            expect(newPage.title).toBe(newPageData.title);
            expect(newPage.content).toBe(newPageData.content);
            expect(newPage.location.lat).toBe(newPageData.location.lat);
            expect(newPage.location.lng).toBe(newPageData.location.lng);
            expect(newPage.location.label).toBe(newPageData.location.label);
            expect(newPage.location.country).toBe(newPageData.location.country);
            expect(newPage.images).toEqual(expect.arrayContaining(newPageData.images));

            done();

        });

        test("Test user can not modify a page if he is not a contributor", async done => {
            const notContributor = await makeUser();
            const page = await makePage();

            const newPageData = {
                title: "new page title",
                content: "New Lorem ipsum",
                location: {lat: 2, lng: 2, label: "new location label", country: "BE"},
                images: Array(5).fill("new_image.png")
            };

            const rep = await request(app)
                .patch("/api/book/" + page.book._id + "/page/" + page._id)
                .set(REQUEST_TOKEN_HEADER, notContributor.token) // connected as notContributor
                .send(newPageData);

            expect(rep.statusCode).toBe(401); // Expect the request succeed

            done();
        });
    });

    describe("Test the page deletion controller", () => {
        test("Test user can delete a page if he is his main author", async done => {
            const page = await makePage();

            const rep = await request(app)
                .delete("/api/book/" + page.book._id + "/page/" + page._id)
                .set(REQUEST_TOKEN_HEADER, page.mainAuthor.token);

            expect(rep.statusCode).toBe(200);

            expect((await Page.find({_id: page._id})).length).toBe(0);

            done();
        });

        test("Test user can delete a page if the book main author", async done => {
            const book = await makeBook();
            const page = await makePage(book);

            const rep = await request(app)
                .delete("/api/book/" + book._id + "/page/" + page._id)
                .set(REQUEST_TOKEN_HEADER, book.mainAuthor.token);

            expect(rep.statusCode).toBe(200);

            expect((await Page.find({_id: page._id})).length).toBe(0);

            done();
        });

        test("User can not delete a page if he is not the book/page main author", async done => {
            const notMainAuthor = await makeUser();
            const book = await makeBook({contributors: [notMainAuthor._id]});
            const page = await makePage(book);

            const rep = await request(app)
                .delete("/api/book/" + page.book._id + "/page/" + page._id)
                .set(REQUEST_TOKEN_HEADER, notMainAuthor.token);

            expect(rep.statusCode).toBe(401);

            expect((await Page.find({_id: page._id})).length).toBe(1);

            done();
        });
    });
});
