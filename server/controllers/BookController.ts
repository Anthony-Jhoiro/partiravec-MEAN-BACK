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

import {Book} from "../models/Book";
import {User} from "../models/User";
import {imagesController} from './ImagesController';
import {ENDPOINT} from '../tools/environment';
import {Request, Response} from "express";
import {requireAuth, requireInBody} from "../tools/decorators";
import {CustomRequest} from "../tools/types";

class BookController {

    /**
     * Create a book
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
            if (err) return res.status(500).json({error: "Une erreure est survenue pendant l'ajout d'un livre."});

            // create a shield on imageCover
            if (book.coverImage.includes(ENDPOINT))
                imagesController.createImageShield(book.coverImage.split('/').pop(), 'book', book._id);

            return res.json({success: 'Le livre ' + book.title + ' a bien été créé !'});
        });
    }

    /**
     * Update a book
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
                if (!optionalBook) return res.status(400).json({error: "Le livre n'existe pas"});
                if (optionalBook.contributors.indexOf(req.currentUserId) === -1)
                    return res.status(401).json({error: "Vous n'êtes pas autorisé à accéder à cette ressource."});

                // Update infos
                optionalBook.title = body.title;
                optionalBook.coverImage = body.coverImage;
                optionalBook.public = !!(body.public);
                optionalBook.updated = Date.now();

                // Save it
                optionalBook.save((err, book) => {
                    if (err) return res.status(500).json({error: "Une erreure est survenue pendant la modification du livre."});

                    // create a shield on imageCover
                    if (book.coverImage.includes(ENDPOINT))
                        imagesController.createImageShield(book.coverImage.split('/').pop(), 'book', book._id);

                    return res.json({success: 'Le livre ' + book.title + ' a bien été modifié !'});
                });
            });
    }

    /**
     * Delete a book
     * @param req
     * @param res
     * @return {Promise<*>}
     * @pathParam id string
     */
    @requireAuth()
    async deleteBook(req: CustomRequest, res: Response) {
        const book = await Book.findOne({_id: req.params.id});
        if (!book) return res.status(400).json({error: "Le livre n'existe pas."});
        if (!book.isMainAuthor(req.currentUserId))
            return res.status(401).json({error: "Vous n'avez pas l'autorisation pour modifier ce livre."});
        Book.deleteOne({_id: req.params.id}, err => {
            if (err) return res.status(500).json({error: "Echec pendant la modification du livre"});
            return res.json({success: "Le livre a bien été supprimé"});
        });
    }

    /**
     * add a user to the contributors
     * @param req
     * @param res
     * @return {Promise<*>}
     * @bodyParam book
     * @bodyParam user
     */
    @requireAuth()
    @requireInBody('book', 'user')
    async addAccessBook(req: Request & { currentUserId: string }, res: Response) {
        const body = req.body;
        const book = await Book.findOne({_id: body.book});
        if (!book) return res.status(400).json({error: "Le livre n'existe pas."});

        // Check that the current user has access
        if (!book.hasAccess(req.currentUserId))
            return res.status(401).json({error: "Vous n'avez pas l'autorisation pour modifier ce livre."});

        // check that the other user exists
        const user = await User.findOne({_id: body.user});
        if (!user) return res.status(401).json({error: "L'utilisateur n'existe pas"});

        // Check that the other user has no access to the project
        if (book.hasAccess(body.user))
            return res.status(400).json({error: "L'utilisateur a déjà accès au projet"});

        // add the user to contributors
        book.contributors.push(body.user)
        book.save((err) => {
            if (err) return res.status(500).json("Une erreur est survenue pendant l'ajout de l'utilisateur");
            return res.json({success: "L'utilisateur a été rajouté aux contributeurs"});
        });
    }

    /**
     * remove user access to a book
     * @param req
     * @param res
     * @return {Promise<*>}
     */
    @requireAuth()
    @requireInBody('book', 'user')
    async removeAccessBook(req: CustomRequest, res: Response) {
        const body = req.body;
        const book = await Book.findOne({_id: body.book});
        if (!book) return res.status(400).json({error: "Le livre n'existe pas."});

        // Check that the current user has access
        if (!book.hasAccess(req.currentUserId))
            return res.status(401).json({error: "Vous n'avez pas l'autorisation pour modifier ce livre."});

        // check that the other user exists
        const user = await User.findOne({_id: body.user});
        if (!user) return res.status(401).json({error: "L'utilisateur n'existe pas"});

        // Check that the other user has no access to the project
        if (!book.hasAccess(body.user))
            return res.status(400).json({error: "L'utilisateur n'a déjà pas accès au projet"});

        // Check if the user is not the book main author
        if (book.mainAuthor == body.user)
            return res.status(400).json({error: "Vous ne pouvez pas supprimer le propriétaire du livre"});

        // add the user to contributors
        book.contributors.splice(book.contributors.indexOf(body.user), 1);
        book.save((err) => {
            if (err) return res.status(500).json("Une erreur est survenue pendant la suppression  de l'utilisateur");
            return res.json({success: "L'utilisateur a été retiré des contributeurs"});
        });
    }

    /**: Response
     * get Public Books
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
     * @param req
     * @param res
     * @return {Promise<*>}
     * @pathParam id string
     */
    async getBookById(req: CustomRequest, res: Response) {

        const optionalBook = await Book.findOne({_id: req.params.id});
        if (!optionalBook) return res.status(400).json({error: "Le livre n'a pas été trouvé."});
        if (!optionalBook.public) {
            if (!req.currentUserId) return res.status(403).json({error: "Cette ressource est privée"})
            if (optionalBook.contributors.indexOf(req.currentUserId) === -1)
                return res.status(401).json({error: "Vous n'êtes pas autorisé à accéder à cette ressource."});
        }

        let book: any = {
            _id: optionalBook._id,
            title: optionalBook.title,
            coverImage: optionalBook.coverImage,
            created: optionalBook.created,
            updated: optionalBook.updated,
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

