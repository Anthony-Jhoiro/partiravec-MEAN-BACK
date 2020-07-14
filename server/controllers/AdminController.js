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

const Book = require('../models/Book');
const Page = require('../models/Page');
const Image = require('../models/Image');
const {ENDPOINT} = require('../tools/environment');

class AdminController {
    async setImageOwning(req, res) {
        const books = await Book.find();
        let images = [];


        // set coverImages
        books.forEach(b => {
            if (!b.coverImage.includes(ENDPOINT)) return;
            const image = new Image({
                url: b.coverImage,
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
                    url: i,
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
}

const adminController = new AdminController();

module.exports = adminController;
