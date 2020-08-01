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

import {CustomRequest} from "./types";
import {Response} from "express";

export function requireAuth() {
    return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
        let method = descriptor.value;

        descriptor.value = function (req: CustomRequest, res: Response) {
            if (! req.currentUserId) {
                return res.status(403).json({"error": "Vous devez être connecté pour accéder à cette ressource"});
            }
            return method(req, res)
        }
    }
}

export function requireInBody(...parameters: Array<string>) {
    return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
        let method = descriptor.value;

        descriptor.value = function (req: CustomRequest, res: Response) {
            for (let parameter of parameters) {
                if (typeof req.body[parameter] === 'undefined') {
                    return res.status(400).json({"error": `Missing parameter [${parameter}] in body`});
                }
            }
            return method(req, res);
        }
    }
}

export function requireInQuery(...parameters: Array<string>) {
    return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
        let method = descriptor.value;

        descriptor.value = function (req: CustomRequest, res: Response) {
            for (let parameter of parameters) {
                if (typeof req.query[parameter] === 'undefined') {
                    return res.status(400).json({"error": `Missing parameter [${parameter}] in query`});
                }
            }
            return method(req, res);
        }
    }
}

