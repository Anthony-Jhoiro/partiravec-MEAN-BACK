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

import {Schema, model, Document} from "mongoose";
import {UserDocument} from "./User";
import {BookDocument} from "./Book";

export type PageDocument = Document & {
    mainAuthor: string | UserDocument;
    lastAuthor: string | UserDocument;
    title: string;
    content: string;
    location: {
        lat: number;
        lng: number;
        label: string;
        country: string;
    };

    images: Array<string>;
    book: string | BookDocument;
    created: Date;
    updated: Date | number;

    isMainAuthor: (userId: string) => boolean;
}


const pagesSchema = new Schema({
    mainAuthor: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    lastAuthor: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    title: String,
    content: String,
    location: {
        type: {
            label: String,
            lat: Number,
            lng: Number,
            Country: Number
        }
    },
    images: [String],
    book: {
        type: Schema.Types.ObjectId,
        ref: 'Book'
    },
    created: Date,
    updated: {type: Date, default: Date.now}
});

pagesSchema.methods.isMainAuthor = function (id) {
    return this.mainAuthor == id;
};

export const Page = model<PageDocument>('Page', pagesSchema, 'pages');

