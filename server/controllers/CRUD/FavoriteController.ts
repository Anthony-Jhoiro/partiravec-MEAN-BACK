import { requireAuth, requireInBody } from '../../tools/decorators';
import { User } from '../../models/User';
import { Book } from '../../models/Book';
import { CustomRequest } from '../../tools/types';
import { Response } from "express";
import { SERVER_ERROR, UNAUTHORIZE } from '../../tools/ErrorTypes';


class FavoriteController {
    
    @requireAuth()
    async getFavoriteBooks(req: CustomRequest, res: Response) {
        const currentUser = await User.findById(req.currentUserId).populate('favorites');
        return res.json(currentUser.favorites);
    }

    async isMarkedAsFavorite(bookId, userId) {
        const count = await User.countDocuments({_id: userId, favorites: bookId})
        return count == 1; 
    }

    @requireAuth()
    @requireInBody('bookId')
    async toggleFavoriteBook(req: CustomRequest, res: Response) {
        const bookId = req.body.bookId;
        const currentUser = await User.findById(req.currentUserId);
        const book = await Book.findById(req.body.bookId);


        if (!book.hasAccess(req.currentUserId)) {
            return res.status(401).send(UNAUTHORIZE);
        }

        const bookIndex = currentUser.favorites.findIndex(book => book._id == bookId);

        if (bookIndex == -1) {
            currentUser.favorites.push(book._id)
        } else {
            currentUser.favorites.splice(bookIndex, 1);
        }

        currentUser.save((err, savedUser) => {
            if (err) return res.status(500).send(SERVER_ERROR);
            return res.json(savedUser.favorites)
        });
    }
}

const favoriteController = new FavoriteController();

export default favoriteController;