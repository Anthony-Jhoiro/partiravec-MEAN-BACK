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

import {Page} from '../../server/models/Page';
import {makeUser, UserMock} from "./makeUser";
import {BookMock, makeBook} from "./makeBook";

export type PageMock = {
    _id: string;
    title: string;
    content: string;
    images: string[];
    mainAuthor: UserMock;
    lastAuthor: UserMock;
    location: {
        lat: number;
        lng: number;
        label: string;
        country: string;
    };
    book: BookMock;
    created: number | Date,
    updated: number | Date
}

let pageIteration = 1;


export const makePage = async (book?: BookMock): Promise<PageMock> => {
    // Set the book
    if (!book) book = await makeBook();

    pageIteration ++ ;

    const author = await makeUser();

    // Set the book
    const pageData = {
        title: "Title " + pageIteration,
        content: "Lorem ipsum ".repeat(pageIteration),
        images: Array(pageIteration).fill("image_"+pageIteration+".png"),
        location: {
            lat: 0,
            lng: 0,
            label: "Location No" + pageIteration,
            country: "FR"
        },
        mainAuthor: author,
        lastAuthor: author,
        book: book._id,
        created: Date.now(),
        updated: Date.now()
    };

    let dbPage = new Page(pageData);

    // save the book
    try {
        dbPage = await dbPage.save();
    } catch (e) {
        console.error("Error creating the page", dbPage)
    }

    return {
        _id: dbPage._id,
        title: dbPage.title,
        content: dbPage.content,
        images: dbPage.images,
        mainAuthor: author,
        lastAuthor: author,
        location: {
            lat: dbPage.location.lat,
            lng: dbPage.location.lng,
            label: dbPage.location.label,
            country: dbPage.location.country,
        },
        book: book,
        created: dbPage.created,
        updated: dbPage.updated
    };
}

