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

import * as mongoose from "mongoose";

beforeEach(function (done) {
        const url = `mongodb://127.0.0.1/partiravectest_${process.env.TEST_SUITE}`;

        function clearDB() {
            for (let i in mongoose.connection.collections) {
                mongoose.connection.collections[i].deleteMany({});
            }
            return done();
        }


        if (mongoose.connection.readyState === 0) {
            mongoose.connect(url, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: true,
                useCreateIndex: true
            })
                .then(() => clearDB());
        }
        else return clearDB();
    }
);

afterEach(function(done) {
    return done();
});

afterAll(done => {
    mongoose.disconnect();
    return done();
});
