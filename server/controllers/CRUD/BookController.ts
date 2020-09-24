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

import {Book} from "../../models/Book";
import {User} from "../../models/User";
import {imagesController} from './ImagesController';
import {ENDPOINT} from '../../tools/environment';
import {Response} from "express";
import {requireAuth, requireInBody} from "../../tools/decorators";
import {CustomRequest} from "../../tools/types";
import { SERVER_ERROR, RESOURCE_NOT_FOUND, UNAUTHORIZE, LOGIN_NEEDED } from "../../tools/ErrorTypes";

class BookController {

    /**
     * Create a book
     * * 200 - book has been created
     * * 500 - error creating the book
     * @param req
     * @param res
     * @bodyParam title string
     * @bodyParam coverImage string
     */
    @requireAuth()
    @requireInBody('title', 'coverImage')
    createBook(req: CustomRequest, res: Response) {
        const body = req.body;

        const book = new Book({
            title: body.title,
            coverImage: body.coverImage,
            contributors: [req.currentUserId],
            mainAuthor: req.currentUserId,
            public: !!(body.public),
            created: Date.now(),
            updated: Date.now()
        });
        book.save((err, book) => {
            if (err) return res.status(500).send(SERVER_ERROR);
            // create a shield on imageCover
            if (book.coverImage.includes(ENDPOINT))
                imagesController.createImageShield(book.coverImage.split('/').pop(), 'book', book._id);

            return res.json(book);
        });
    }

    /**
     * Update a book
     * * 200 - book has been updated
     * * 404 - book not found
     * * 401 - user has no access to modify the book
     * @param req
     * @param res
     * @bodyParam title string
     * @bodyParam coverImage string
     * @pathParam id string(hex)
     */
    @requireAuth()
    @requireInBody('title', 'coverImage')
    updateBook(req: CustomRequest, res: Response) {
        const body = req.body;

        const bookId = req.params.id;
        Book.findOne({_id: bookId})
            .then(optionalBook => {
                // Check if the user can update the book
                if (!optionalBook) return res.status(404).send(RESOURCE_NOT_FOUND)
                if (optionalBook.contributors.indexOf(req.currentUserId) === -1)
                    return res.status(401).send(UNAUTHORIZE);
                // Update infos
                optionalBook.title = body.title;
                optionalBook.coverImage = body.coverImage;
                optionalBook.public = !!(body.public);
                optionalBook.updated = Date.now();

                // Save it
                optionalBook.save((err, book) => {
                    if (err) return res.status(500).send(SERVER_ERROR);

                    // create a shield on imageCover
                    if (book.coverImage.includes(ENDPOINT))
                        imagesController.createImageShield(book.coverImage.split('/').pop(), 'book', book._id);

                    return res.json(book);
                });
            });
    }

    /**
     * Delete a book :
     * * 200 - book deleted  
     * * 404 - book not found  
     * * 401 - user can not delete the book  
     * @param req
     * @param res
     * @return {Promise<*>}
     * @pathParam id string
     */
    @requireAuth()
    async deleteBook(req: CustomRequest, res: Response) {
        // Check if the book exists
        const bookId = req.params.id;
        const book = await Book.findOne({_id: bookId});
        if (!book) return res.status(404).send(RESOURCE_NOT_FOUND)

        // Check if the user has the authorisation to delete the book
        if (!book.isMainAuthor(req.currentUserId))
            return res.status(401).send(UNAUTHORIZE);

        Book.deleteOne({_id: bookId}, err => {
            if (err) return res.status(500).send(SERVER_ERROR);
            return res.json(book);
        });
    }

    /**
     * get Public Books :
     * * 200 - fetch succeed
     * @param req
     * @param res
     * @return {Promise<void>}
     */
    async getPublicBooks(req: CustomRequest, res: Response) {
        let books = await Book
            .find({
                public: true
            })
            .sort({updated: -1})
            .populate('mainAuthor', 'username');

        const booksToSend = books.map(book => {
            return {
                public: book.public,
                _id: book._id,
                title: book.title,
                coverImage: book.coverImage,
                mainAuthor: book.mainAuthor,
                created: book.created,
                updated: book.updated,
                access: (req.currentUserId) ? book.hasAccess(req.currentUserId) : false
            }
        });


        return res.json(booksToSend);
    }

    /**
     * Return the books where the user is a contributor
     * * 200 - fetch succeed
     * @param req
     * @param res
     * @return {Promise<*>}
     */
    @requireAuth()
    async getBooksWhereUserIsAContributor(req: CustomRequest, res: Response) {
        let books = await Book
            .find({contributors: req.currentUserId})
            .sort({updated: -1})
            .populate('mainAuthor', 'username');

        const booksToSend = books.map(book => {
            return {
                public: book.public,
                _id: book._id,
                title: book.title,
                coverImage: book.coverImage,
                mainAuthor: book.mainAuthor,
                created: book.created,
                updated: book.updated,
                access: true
            }
        });
        return res.json(booksToSend);
    }

    /**
     * Get a book by its id
     * * 200 - fetch succeed
     * * 404 - book not found
     * * 403 - user need to be log to see the book
     * * 401 - user is not authorize to see the book
     * @param req
     * @param res
     * @return {Promise<*>}
     * @pathParam id string
     */
    async getBookById(req: CustomRequest, res: Response) {

        const optionalBook = await Book.findOne({_id: req.params.id});
        if (!optionalBook) return res.status(404).send(RESOURCE_NOT_FOUND);
        if (!optionalBook.public) {
            if (!req.currentUserId) return res.status(403).send(LOGIN_NEEDED);
            if (optionalBook.contributors.indexOf(req.currentUserId) === -1)
                return res.status(401).send(UNAUTHORIZE);
        }

        let book: any = {
            _id: optionalBook._id,
            title: optionalBook.title,
            coverImage: optionalBook.coverImage,
            created: optionalBook.created,
            updated: optionalBook.updated,
            public: optionalBook.public,
            access: (req.currentUserId) ? optionalBook.hasAccess(req.currentUserId) : false
        };

        //Add the list of contributors
        book.contributors = await User
            .find({
                $and: [
                    {_id: {$in: optionalBook.contributors}},
                    {_id: {$ne: req.currentUserId}}
                ]
            }, {password: 0, salt: 0, updated: 0});

        // Add main author
        book.mainAuthor = await User
            .find({
                $and: [
                    {_id: optionalBook.mainAuthor}
                ]
            }, {password: 0, salt: 0, updated: 0});

        return res.json(book);

    }
}

export const bookController = new BookController();

