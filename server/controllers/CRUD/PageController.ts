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
import {Page} from "../../models/Page";
import {ENDPOINT} from '../../tools/environment';
import {imagesController} from './ImagesController';
import {CustomRequest} from "../../tools/types";
import {Response} from "express";
import {requireAuth, requireInBody} from "../../tools/decorators";

class PageController {
    /**
     * Create a new page
     * @param req
     * @param res
     * @bodyParam title string
     * @bodyParam content string
     * @bodyParam images string[]
     * @bodyParam location {lat, lng, label}
     */
    @requireInBody('title', 'content', 'images', 'location')
    @requireAuth()
    async addPage(req: CustomRequest, res: Response) {
        const body = req.body;
        const currentUser = req.currentUserId;

        // Get the book
        const book = await Book.findOne({_id: req.params.book});

        // Check if the book exists
        if (!book) return res.status(404).json({error: "Le livre n'existe pas."});

        // Check if the user has access to the book
        if (!book.hasAccess(currentUser))
            return res.status(401).json({error: "Vous n'êtes pas autorisé à modifier ce livre."});

        // Create the page
        const newPage = new Page({
            mainAuthor: currentUser,
            lastAuthor: currentUser,
            title: body.title,
            content: body.content,
            location: body.location,
            images: body.images,
            book: book,
            created: Date.now(),
            updated: Date.now()
        });

        newPage.save((err, page) => {
            if (err) return res.status(500).json({error: "Une erreur est survenue pendant l'ajout de la page."});

            // create shields on images
            page.images.forEach(i => {
                if (i.includes(ENDPOINT))
                    imagesController.createImageShield(i.split('/').pop(), 'book', page.book);
            })
            return res.json({success: "La page " + page.title + " a bien été créée."});
        });
    }

    /**
     * Update a page
     * @param req
     * @param res
     * @requestParam book string
     * @requestParam page string
     * @bodyParam title string
     * @bodyParam content string
     * @bodyParam images string[]
     * @bodyParam location {lat, lng, label}
     */
    @requireAuth()
    @requireInBody('title', 'content', 'images', 'location')
    async updatePage(req: CustomRequest, res: Response) {
        const body = req.body;
        const currentUser = req.currentUserId;

        // the page exists and current user has access to it.
        const page = await Page.findOne({book: req.params.book, _id: req.params.page}).populate('book');

        if (!page)
            return res.status(404).json({error: "La page demandée n'existe pas"});

        // @ts-ignore
        if (!page.book.hasAccess(currentUser))
            return res.status(401).json("Vous n'avez pas l'autorisation d'accéder à ce livre.");

        // Update infos and save the page
        page.title = body.title;
        page.content = body.content;
        page.images = body.images;
        page.location = body.location;
        page.updated = Date.now();
        page.lastAuthor = currentUser;

        page.save((err, page) => {
            if (err) return res.status(500).json({error: "Une erreur est survenue pendant la modification de la page."});
            return res.json({success: "La page " + page.title + " a bien été modifiée."});
        });
    }

    /**
     * Delete a page
     * @param req
     * @param res
     * @requestParam book string
     * @requestParam page string
     */
    @requireAuth()
    async deletePage(req: CustomRequest, res: Response) {
        const currentUser = req.currentUserId;

        // Get page
        const page = await Page.findOne({book: req.params.book, _id: req.params.page}).populate('book');
        if (!page) return res.status(404).json({error: "La page n'existe pas."});

        // Check authorisation
        // @ts-ignore
        if ((!page.isMainAuthor(currentUser)) && (!page.book.isMainAuthor(currentUser)))
            return res.status(401).json({error: "Vous n'êtes pas autorisé à supprimer cette page"});

        // delete the page
        await Page.deleteOne({_id: req.params.page}, err => {
            if (err) return res.status(500).json({
                error: "Une erreur est intervenue pendant la suppression de la page",
                message: err.error
            });
            return res.json({success: "La page a bien été supprimée"});
        });
    }

    /**
     * get pages
     * @param req
     * @param res
     * @requestParam book
     * @queryParam min boolean get minified results
     */
    async getPages(req: CustomRequest, res: Response) {
        const currentUser = req.currentUserId;
        // Check authorisation on the book
        const book = await Book.findOne({_id: req.params.book});
        if (!book) return res.status(404).json({error: "Le livre n'existe pas."});
        if (!(book.hasAccess(currentUser)) && !book.public) return res.status(401).json({error: "Vous n'avez pas la permission d'accéder au livre"});

        if (req.query.min) {
            const pages = await Page.find({book: book}, {_id: 1, title: 1, location: 1});
            return res.json(pages);
        } else {
            const pages = await Page.find({book: book});
            return res.json(pages);
        }

    }

    /**
     * get a page by its id
     * @param req
     * @param res
     * @requestParam page string
     * @requestParam book string
     */
    async getPageById(req: CustomRequest, res: Response) {
        const currentUser = req.currentUserId;
        // Check authorisation on the book
        const page = await Page.findOne({_id: req.params.page, book: req.params.book}).populate('book');
        if (!page) return res.status(404).json({error: "La page n'existe pas."});
        // @ts-ignore
        if (!(page.book.hasAccess(currentUser)) && !page.book.public)
            return res.status(401).json({error: "Vous n'avez pas la permission d'accéder au livre"});

        return res.json(page);
    }

    async getCountriesWithLocations(req: CustomRequest, res: Response) {
        const currentUser = req.currentUserId;
        // Check authorisation on the book
        const book = await Book.findOne({_id: req.params.book});
        if (!book) return res.status(404).json({error: "Le livre n'existe pas."});
        if (!(book.hasAccess(currentUser)) && !book.public) return res.status(401).json({error: "Vous n'avez pas la permission d'accéder au livre"});

        const countries = await Page.find({book: book}).distinct("location.country");

        return res.json(countries);
    }

    async getPagesFromCountry(req: CustomRequest, res: Response) {
        const currentUser = req.currentUserId;
        // Check authorisation on the book
        const book = await Book.findOne({_id: req.params.book});
        if (!book) return res.status(404).json({error: "Le livre n'existe pas."});
        if (!(book.hasAccess(currentUser)) && !book.public) return res.status(401).json({error: "Vous n'avez pas la permission d'accéder au livre"});

        const pages = await Page.find({book: req.params.book, 'location.country': req.params.country});

        return res.json(pages);
    }
}

export const pageController = new PageController();

