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

import {User, UserDocument} from '../models/User';
import * as crypto from 'crypto';
import {addJwtToken} from "../tools/jwtAdder";
import {jwtVerify} from "../tools/jwtVerify";
import {Request, Response} from "express";
import {requireInBody} from "../tools/decorators";

/**
 * Username Regex :
 * At least 5 characters, start with a letter, case insensitive, can contain numbers, '_' '-' '.' and letters
 * @type {RegExp}
 */
const loginRegex = /^[a-z][a-z0-9_\-.]{4,}$/i;
const saltLength = 255;

class AuthenticationController {


    /**
     * Log a user with given credentials
     * @param req
     * @param res
     * @return Response
     * @bodyParam login string
     * @bodyParam password string
     */
    @requireInBody('login', 'password')
    login(req: Request, res: Response): any | Response {
        const body = req.body;

        const doLogin = optionalUser => {
            const hash = crypto.createHash('sha512', optionalUser.salt);
            hash.update(body.password);
            if (hash.digest('hex') !== optionalUser.password)
                return res.status(401).json({error: "Mot de passe incorrect"});

            const longDuration = (body.longDuration) ? body.longDuration : false;

            addJwtToken(res, {id: optionalUser._id}, longDuration);

            return res.json({
                success: "Vous êtes connecté !",
                data: {
                    user: {
                        username: optionalUser.username,
                        email: optionalUser.email,
                        _id: optionalUser._id,
                    }
                }
            });
        }

        if (body.login.indexOf('@') !== -1) {
            // Authentication with email
            User.findOne({email: body.login})
                .then(optionalUser => {
                    if (!optionalUser) return res.status(400).json({error: "L'adresse email n'existe pas"});

                    return doLogin(optionalUser);
                });

        } else {
            // Authentication with password
            User.findOne({username: body.login})
                .then(optionalUser => {
                    if (!optionalUser) return res.status(400).json({error: "L'identifiant n'existe pas"});

                    return doLogin(optionalUser);
                });
        }
    }

    /**
     * Register a user
     * @param req
     * @param res
     * @return {*|Promise<any>}
     * @bodyParam username string
     * @bodyParam password string
     * @bodyParam email string
     */
    @requireInBody('username', 'password', 'email')
    register(req: Request, res: Response): Response {
        const body = req.body;

        if (!loginRegex.test(body.username)) {
            return res.status(400).json({"error": "Le nom d'utilisateur est incorrect"});
        }

        // Check email unique
        User.findOne({username: body.username})
            .then(optionalUser => {
                if (optionalUser) return res.status(400).json({error: "Le nom d'utilisateur est déjà utilisé"});

                // check username unique
                User.findOne({email: body.email})
                    .then(optionalUser => {
                        if (optionalUser) return res.status(400).json({error: "L'adresse email est déjà utilisée"});

                        // set salt and hash password
                        const salt = crypto
                            .randomBytes(Math.ceil(saltLength / 2))
                            .toString('hex')
                            .slice(0, saltLength);

                        // @ts-ignore
                        const hash = crypto.createHash('sha512', salt);
                        hash.update(body.password);
                        const hashedPassword = hash.digest('hex');


                        // create the user
                        const user = new User({
                            username: body.username,
                            salt: salt,
                            password: hashedPassword,
                            email: body.email,
                            created: Date.now(),
                        });

                        user.save((err, user: UserDocument) => {
                            if (err) {
                                return res.status(500).json({
                                    error: "Impossible de créer l'utilisateur",
                                    message: err.error
                                })
                            }

                            addJwtToken(res, {id: user._id});
                            return res.json({
                                success: "Votre compte a bien été créé !",
                                data: {
                                    user: {
                                        username: user.username,
                                        email: user.email,
                                        _id: user._id
                                    }
                                }
                            });
                        })

                    });

            });

    }

    checkPasswordReceiveLink(req: Request, res: Response) {
        const token = req.params.token;

        jwtVerify(token, () => {
            return res.json({success: "Le lien est valide"});
        }, () => {
            return res.json({error: "Le lien est invalide"});
        });
    }

    @requireInBody('token', 'password')
    async renewPassword(req: Request, res: Response) {
        const token = req.body.token;

        jwtVerify(token, (decoded) => {

            User.findOne({_id: decoded.id})
                .then((user: UserDocument) => {
                    // @ts-ignore
                    const hash = crypto.createHash('sha512', user.salt);
                    hash.update(req.body.password);
                    user.password = hash.digest('hex');
                    user.save((err) => {
                        if (err) return res.status(500).json({error: "Votre mot de passe n'a pas pu être modifié"});
                        return res.json({success: "Votre mot de passe a bien été mis à jour"});
                    });
                });

        }, () => {
            return res.json({error: "Le lien est invalide, le délai de 1h a été écoulé."});
        });
    }
}

export const authenticationController = new AuthenticationController();

