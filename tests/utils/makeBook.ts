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

import {Book} from '../../server/models/Book';
import {makeUser, UserMock} from "./makeUser";

export type BookMock = {
    _id: string,
    title: string,
    coverImage: string,
    mainAuthor: UserMock,
    contributors: Array<any>,
    public: boolean,
    created: number | Date,
    updated: number | Date
}

let bookIteration = 0;


export const makeBook = async (book?: { title: string; coverImage: string; public: boolean, contributors: Array<any> }, user?: UserMock): Promise<BookMock> => {
    // Set the author
    if (!user) user = await makeUser();

    bookIteration ++ ;

    // Set the book
    if (!book) book = {
        title: "Book " + bookIteration,
        coverImage: "image " + bookIteration,
        contributors: [],
        public: false
    };

    book.contributors.push(user._id);

    let dbBook = new Book({
        title: book.title,
        coverImage: book.coverImage,
        public: book.public,
        contributors: book.contributors,
        mainAuthor: user._id,
        created: Date.now(),
        updated: Date.now()
    });

    // save the book
    try {
        dbBook = await dbBook.save();
    } catch (e) {
        console.error("Error creating the book", dbBook)
    }

    return {
        _id: dbBook._id,
        title: dbBook.title,
        coverImage: dbBook.coverImage,
        mainAuthor: user,
        contributors: dbBook.contributors,
        public: dbBook.public,
        created: dbBook.created,
        updated: dbBook.updated
    };
}
