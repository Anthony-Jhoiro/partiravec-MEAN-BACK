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

const User = require('../models/User');
const crypto = require('crypto');
const jwtAdder = require("../tools/jwtAdder");

/**
 * Username Regex :
 * At least 5 characters, start with a letter, case insensitive, can contain numbers, '_' '-' '.' and letters
 * @type {RegExp}
 */
const loginRegex = /^[a-z][a-z0-9_\-.]{4,}$/i;
const saltLength = 255;

class AuthenticationController {
  currentUser;


  /**
   * Log a user with given credentials
   * @param req
   * @param res
   * @return {*|Promise<any>}
   * @bodyParam login string
   * @bodyParam password string
   */
  login(req, res) {
    const body = req.body;
    if (!(body.login && body.password)) {
      return res.status(400).json("Requête incomplete");
    }

    const doLogin = optionalUser => {
      const hash = crypto.createHash('sha512', optionalUser.salt);
      hash.update(body.password);
      if (hash.digest('hex') !== optionalUser.password)
        return res.status(400).json({error: "Mot de passe incorrect"});

      jwtAdder(res, {id: optionalUser._id});

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
  register(req, res) {
    const body = req.body;
    // Check request validity
    if (!(body.username && body.password && body.email)) {
      return res.status(400).json({error: "Requête incomplete : ", body: req.body});
    }

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
              .randomBytes(Math.ceil(saltLength/2))
              .toString('hex')
              .slice(0, saltLength);

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

            user.save((err, user) => {
              if (err) {
                return res.status(500).json({error: "Impossible de créer l'utilisateur", message: err.error})
              }

              jwtAdder(res, {id: user._id});
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
}

const authenticationController = new AuthenticationController();

module.exports = authenticationController;
