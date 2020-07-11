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

const Book= require('../models/Book');
const Travel = require('../models/Travel');

class TravelController {
    /**
     * Get the list of travels for the given book
     * @param res
     * @param req
     * @pathParam book
     */
    async getTravelsFromBook(req, res) {
        // Get the book & check access
        const book = await Book.findOne({ _id: req.params.book });
        if (!book) return res.status(404).json({error: "Le livre demandé est introuvable"});

        if (!book.canRead(req.currentUserId)) return res.status(401).json({error: "Vous n'avez pas la permission de lire ce livre"});

        // get tre travels

        return res.json(await Travel.find({book: book}));
    }

    /**
     * Create a travel
     * @param req
     * @param res
     * @pathParam book
     * @bodyParam steps
     * @return {Promise<void>}
     */
    async createTravel(req, res) {
        if (!req.body.steps) return res.status(400);

        // get book and check access
        const book = await Book.findOne({ _id: req.params.book });
        if (!book) return res.status(404).json({error: "Le livre demandé est introuvable"});
        if (!book.hasAccess(req.currentUserId)) return res.status(401).json({error: "Vous n'avez pas la permission d'écrire dans ce livre"});

        // Create the travel
        const travel = new Travel({
            book: book,
            steps: req.body.steps
        });

        travel.save((err) => {
            if (err) return res.status(500).json({error: "Impossible de créer le voyage."});
            return res.json({success: "Le voyage a bien été créé !"});
        });

    }

    /**
     * Create a travel
     * @param req
     * @param res
     * @pathParam book
     * @pathParam travel
     * @bodyParam steps
     */
    async updateTravel(req, res) {
        // get book
        if (!req.body.steps) return res.status(400);

        // get book and check access
        const travel = await Travel.findOne({ _id: req.params.travel, book: res.params.book }).populate('book');
        if (!travel) return res.status(404).json({error: "Le voyage demandé est introuvable"});
        if (!travel.book.hasAccess(req.currentUserId)) return res.status(401).json({error: "Vous n'avez pas la permission d'écrire dans ce livre"});

        travel.steps = req.body.steps;

        travel.save((err) => {
            if (err) return res.status(500).json({error: "Impossible de modifier le voyage."});
            return res.json({success: "Le voyage a bien été modifié !"});
        });
    }

}

const travelController = new TravelController();

module.exports = travelController;
