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

import { Response } from "express";
import { requireAuth, requireInBody } from "../../tools/decorators";
import { CustomRequest } from "../../tools/types";
import {
  SERVER_ERROR,
  RESOURCE_NOT_FOUND,
  UNAUTHORIZE,
  LOGIN_NEEDED,
  INVALID_PARAMETER,
} from "../../tools/ErrorTypes";
import {
  createBook,
  deleteBookById,
  getBookById,
  getBooks,
  updateBook,
} from "../../repositories/BookRepository";

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
  @requireInBody("title", "coverImage")
  async createBook(req: CustomRequest, res: Response) {
    const body = req.body;

    try {
      const book = createBook(
        body.title,
        body.coverImage,
        req.currentUserId,
        !!body.public
      );
      return res.json(book);
    } catch (e) {
      return res.status(500).send(SERVER_ERROR);
    }
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
  @requireInBody("title", "coverImage")
  async updateBook(req: CustomRequest, res: Response) {
    const body = req.body;
    const bookId = req.params.id;

    try {
      const book = await updateBook(
        bookId,
        req.currentUserId,
        body.title,
        body.coverImage,
        !!body.public
      );
      return res.json(book);
    } catch (err) {
      if (err.message == RESOURCE_NOT_FOUND)
        return res.status(404).send(RESOURCE_NOT_FOUND);
      if (err.message == UNAUTHORIZE) return res.status(401).send(UNAUTHORIZE);
      return res.status(500).send(SERVER_ERROR);
    }
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
    try {
      const previousBook = deleteBookById(bookId, req.currentUserId);
    } catch (e) {
      switch (e.message) {
        case RESOURCE_NOT_FOUND:
          return res.status(404).send(RESOURCE_NOT_FOUND);
        case UNAUTHORIZE:
          return res.status(401).send(UNAUTHORIZE);
        default:
          return res.status(500).send(SERVER_ERROR);
      }
    }
  }

  /**
   * get Public Books :
   * * 200 - fetch succeed
   * @param req
   * @param res
   * @return {Promise<void>}
   */
  async getPublicBooks(req: CustomRequest, res: Response) {
    if (req.query.limit && typeof req.query.limit != "string")
      return res.status(400).send(INVALID_PARAMETER);

    if (req.query.offset && typeof req.query.offset != "string")
      return res.status(400).send(INVALID_PARAMETER);

    //@ts-ignore
    const limit = parseInt(req.query.limit) || 10;
    //@ts-ignore
    const offset = parseInt(req.query.offset) || 0;

    const books = await getBooks(limit, offset, req.currentUserId, {
      //@ts-ignore
      searchString: req.query.s,
    });

    return res.json(books);
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
    if (req.query.limit && typeof req.query.limit != "string")
      return res.status(400).send(INVALID_PARAMETER);

    if (req.query.offset && typeof req.query.offset != "string")
      return res.status(400).send(INVALID_PARAMETER);

    //@ts-ignore
    const limit = parseInt(req.query.limit) || 10;
    //@ts-ignore
    const offset = parseInt(req.query.offset) || 0;

    const books = await getBooks(limit, offset, req.currentUserId, {
      //@ts-ignore
      searchString: req.query.s,
      userIsAContributor: true
    });

    return res.json(books);
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

    try {
      const book = await getBookById(req.params.id, req.currentUserId, { pages: true, contributors: true })
      return res.json(book);
    } catch (e) {
      switch (e.message) {
        case RESOURCE_NOT_FOUND:
          return res.status(404).send(RESOURCE_NOT_FOUND);
        case LOGIN_NEEDED:
          return res.status(403).send(LOGIN_NEEDED);
        case UNAUTHORIZE:
          return res.status(401).send(UNAUTHORIZE);
        default:
          return res.status(500).send(SERVER_ERROR);
      }
    }
  }
}

export const bookController = new BookController();
