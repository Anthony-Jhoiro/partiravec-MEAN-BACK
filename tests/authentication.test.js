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

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../server/models/User');
const makeUser = require('./utils/makeUser');

beforeAll(async () => {
    const url = `mongodb://127.0.0.1/partiravectest`
    await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
});

// Cleans up database between each test
beforeEach(async () => {
    await User.deleteMany();
})


describe("Test the api path", () => {
    test("It should response to he GET method", done => {
        return request(app)
            .get("/api")
            .then(response => {
                expect(response.statusCode).toBe(200);
                done();
            });
    })
});

describe("Test register", () => {
    test("It should create an account, if all the parameters are valid", async done => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({username: "rdmName", password: "rdmPassword", email: "rdmEmail@mail.com"})
            .expect(200)
            .then(response => {
                expect(response.body.success).toBe("Votre compte a bien été créé !");
            });
        const user = await User.findOne({username: "rdmName",  email: "rdmEmail@mail.com"});
        expect(user.username).toBeTruthy();
        expect(user.email).toBeTruthy();
        done();
    });

    test("It should sendBack a 400 error when a parameter is missed", async done => {
        await request(app)
            .post('/api/auth/register')
            .send({username: "rdmName", email: "rdmEmail@mail.com"})
            .expect(400);
        await request(app)
            .post('/api/auth/register')
            .send({password: "rdmPassword", email: "rdmEmail@mail.com"})
            .expect(400);
        await request(app)
            .post('/api/auth/register')
            .send({username: "rdmName", password: "rdmPassword"})
            .expect(400);
        done();
    });

    describe("It should return a 400 status if the username or the email is already taken", () => {
        const user = new User({username: "JohnnyBanana", email: "johnny.banana@mail.com"});


        test("Test username unique", async done => {
            const user = new User({username: "JohnnyBanana", email: "johnny.banana@mail.com"});
            const a = await user.save();
            request(app)
                .post('/api/auth/register')
                .send({username: a.username, email: "rdmEmail@mail.com", password: "password"})
                .expect(400)
                .then(() => done())
        });

        test("Test email unique", async done => {
            const user = new User({username: "JohnnyBanana", email: "johnny.banana@mail.com"});
            const a = await user.save();
            return request(app)
                .post('/api/auth/register')
                .send({username: "rdmName", email: a.email, password: "password"})
                .expect(400)
                .then(() => done())
        });
    });
});

describe("Test the login route", () => {
    test("User can connect with username", async done => {
        const user = await makeUser(app);
        return request(app)
            .post('/api/auth/login')
            .send({login: user.username, password: user.password})
            .expect(200)
            .then(() => done());
    });

    test("User can connect with email", async done => {
        const user = await makeUser(app);
        return request(app)
            .post('/api/auth/login')
            .send({login: user.email, password: user.password})
            .expect(200)
            .then(() => done());
    });

    describe("User recieve bad request if parameters are missing",  () => {
        test("Missing login", async done => {
            const user = await makeUser(app);
            return request(app)
                .post('/api/auth/login')
                .send({login: user.username})
                .expect(400)
                .then(() => done());
        });

        test("Missing password", async done => {
            const user = await makeUser(app);
            return request(app)
                .post('/api/auth/login')
                .send({password: user.password})
                .expect(400)
                .then(() => done());
        });
    });

    test("Incorrect password", async done => {
        const user = await makeUser(app);
        return request(app)
            .post('/api/auth/login')
            .send({login: user.username, password: "hello"})
            .expect(400)
            .then(() => done());
    });

    test("Incorrect login", async done => {
        const user = await makeUser(app);
        return request(app)
            .post('/api/auth/login')
            .send({login: "wrong login", password: user.password})
            .expect(400)
            .then(() => done());
    });
});

