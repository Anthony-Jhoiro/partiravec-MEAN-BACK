import {Book} from "../../models/Book";
import {User} from "../../models/User";
import {Request, Response} from "express";
import {requireAuth, requireInBody} from "../../tools/decorators";
import {CustomRequest} from "../../tools/types";
import { SERVER_ERROR, RESOURCE_NOT_FOUND, UNAUTHORIZE, USER_NOT_FOUND, USELESS, NO_PRIVILEGE } from "../../tools/ErrorTypes";

class BookContributorsController {
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
        if (!book) return res.status(404).send(RESOURCE_NOT_FOUND);

        // Check that the current user has access
        if (!book.hasAccess(req.currentUserId))
            return res.status(401).send(UNAUTHORIZE);
        // check that the other user exists
        const user = await User.findOne({_id: body.user});
        if (!user) return res.status(404).send(USER_NOT_FOUND);

        // Check that the other user has no access to the project
        if (book.hasAccess(body.user))
            return res.status(400).send(USELESS);

        // add the user to contributors
        book.contributors.push(body.user)
        book.save((err) => {
            if (err) return res.status(500).send(SERVER_ERROR)
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
        if (!book) return res.status(404).send(RESOURCE_NOT_FOUND)

        // Check that the current user has access
        if (!book.hasAccess(req.currentUserId))
            return res.status(401).send(UNAUTHORIZE);

        // check that the other user exists
        const user = await User.findOne({_id: body.user});
        if (!user) return res.status(404).send(USER_NOT_FOUND)

        // Check that the other user has no access to the project
        if (!book.hasAccess(body.user))
            return res.status(400).send(USELESS);

        // Check if the user is not the book main author
        if (book.mainAuthor == body.user)
            return res.status(400).send(NO_PRIVILEGE);

        // add the user to contributors
        book.contributors.splice(book.contributors.indexOf(body.user), 1);
        book.save((err) => {
            if (err) return res.status(500).send(SERVER_ERROR);
            return res.json({success: "L'utilisateur a été retiré des contributeurs"});
        });
    }
}

export const bookContributorsController = new BookContributorsController();