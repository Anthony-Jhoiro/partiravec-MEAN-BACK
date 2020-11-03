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

import { CustomRequest } from "../../tools/types";
import { Response } from "express";
import { requireAuth, requireInBody } from "../../tools/decorators";
import {
  RESOURCE_NOT_FOUND,
  UNAUTHORIZE,
  SERVER_ERROR,
  DEPRECATED,
} from "../../tools/ErrorTypes";
import {
  createPage,
  deletePage,
  getPageById,
  getPages,
  updatePage,
} from "../../repositories/PageRepository";

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
  @requireInBody("title", "content", "images", "location")
  @requireAuth()
  async addPage(req: CustomRequest, res: Response) {
    const body = req.body;
    const currentUser = req.currentUserId;

    try {
      const page = await createPage(
        currentUser,
        req.params.book,
        body.title,
        body.content,
        body.images,
        body.location
      );
      return res.json(page);
    } catch (e) {
      console.log(e.message)
      switch (e.message) {
        case UNAUTHORIZE:
          return res.status(401).send(UNAUTHORIZE);
        case RESOURCE_NOT_FOUND:
          return res.status(404).send(RESOURCE_NOT_FOUND);
        default:
          return res.status(500).send(SERVER_ERROR);
      }
    }
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
  @requireInBody("title", "content", "images", "location")
  async updatePage(req: CustomRequest, res: Response) {
    const body = req.body;
    const currentUser = req.currentUserId;

    try {
      const page = await updatePage(
        req.params.book,
        req.params.page,
        currentUser,
        body.title,
        body.content,
        body.images,
        body.location
      );
      return res.json(page);
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
   * Delete a page
   * @param req
   * @param res
   * @requestParam book string
   * @requestParam page string
   */
  @requireAuth()
  async deletePage(req: CustomRequest, res: Response) {
    const currentUser = req.currentUserId;

    try {
      const page = await deletePage(
        req.params.book,
        req.params.page,
        currentUser
      );
      return res.json(page);
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
   * get pages
   * @param req
   * @param res
   * @requestParam book
   * @queryParam min boolean get minified results
   */
  async getPages(req: CustomRequest, res: Response) {
    const currentUser = req.currentUserId;

    try {
      const pages = await getPages(req.params.book, currentUser);
      return res.json(pages);
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
   * get a page by its id
   * @param req
   * @param res
   * @requestParam page string
   * @requestParam book string
   */
  async getPageById(req: CustomRequest, res: Response) {
    const currentUser = req.currentUserId;
    // Check authorisation on the book

    try {
      const page = await getPageById(
        req.params.book,
        req.params.page,
        currentUser
      );
      if (page) return res.json(page);
      return res.status(404).send(RESOURCE_NOT_FOUND);

    } catch (e) {
      switch (e.message) {
        case UNAUTHORIZE:
          return res.status(401).send(UNAUTHORIZE);
        default:
          return res.status(500).send(SERVER_ERROR);
      }
    }
  }

  /**
   * @deprecated
   * @param req 
   * @param res 
   */
  async getCountriesWithLocations(req: CustomRequest, res: Response) {
    return res.status(400).send(DEPRECATED);
  }

  /**
   * @deprecated
   * @param req 
   * @param res 
   */
  async getPagesFromCountry(req: CustomRequest, res: Response) {
    return res.status(400).send(DEPRECATED);
  }
}

export const pageController = new PageController();
