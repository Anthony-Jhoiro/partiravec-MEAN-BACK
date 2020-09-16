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
import { Book } from "../../models/Book";
import { User } from "../../models/User";
import { Request, Response } from "express";
import { requireAuth, requireInBody } from "../../tools/decorators";
import { CustomRequest } from "../../tools/types";
import {
  SERVER_ERROR,
  RESOURCE_NOT_FOUND,
  UNAUTHORIZE,
  USER_NOT_FOUND,
  USELESS,
  NO_PRIVILEGE,
} from "../../tools/ErrorTypes";

class BookContributorsController {
  /**
   * Add a user to the contributors :
   * * 200 - user has been added
   * * 404 - user / book not found
   * * 401 - can not add the user
   * * 500 - error adding the user
   * @param req
   * @param res
   * @return {Promise<*>}
   * @bodyParam book
   * @bodyParam user
   */
  @requireAuth()
  @requireInBody("book", "user")
  async addAccessBook(req: Request & { currentUserId: string }, res: Response) {
    const body = req.body;
    const book = await Book.findOne({ _id: body.book });
    if (!book) return res.status(404).send(RESOURCE_NOT_FOUND);

    // Check that the current user has access
    if (!book.hasAccess(req.currentUserId))
      return res.status(401).send(UNAUTHORIZE);
    // check that the other user exists
    const user = await User.findOne({ _id: body.user });
    if (!user) return res.status(404).send(USER_NOT_FOUND);

    // Check that the other user has no access to the project
    if (book.hasAccess(body.user)) return res.status(400).send(USELESS);

    // add the user to contributors
    book.contributors.push(body.user);
    book.save((err, book) => {
      if (err) return res.status(500).send(SERVER_ERROR);
      return res.json(book);
    });
  }

  /**
   * Remove user access to a book
   * * 200 - user has been removed
   * * 401 - user is not authorize / user can not remove the administrator
   * * 404 - user / book not found
   * * 400 - user has not access anyway
   * * 500 - error creating the user
   * @param req
   * @param res
   * @return {Promise<*>}
   */
  @requireAuth()
  @requireInBody("book", "user")
  async removeAccessBook(req: CustomRequest, res: Response) {
    const body = req.body;
    const book = await Book.findOne({ _id: body.book });
    if (!book) return res.status(404).send(RESOURCE_NOT_FOUND);

    // Check that the current user has access
    if (!book.hasAccess(req.currentUserId))
      return res.status(401).send(UNAUTHORIZE);

    // check that the other user exists
    const user = await User.findOne({ _id: body.user });
    if (!user) return res.status(404).send(USER_NOT_FOUND);

    // Check that the other user has no access to the project
    if (!book.hasAccess(body.user)) return res.status(400).send(USELESS);

    // Check if the user is not the book main author
    if (book.mainAuthor == body.user) return res.status(401).send(NO_PRIVILEGE);

    // add the user to contributors
    book.contributors.splice(book.contributors.indexOf(body.user), 1);
    book.save((err, book) => {
      if (err) return res.status(500).send(SERVER_ERROR);
      return res.json(book);
    });
  }
}

export const bookContributorsController = new BookContributorsController();
