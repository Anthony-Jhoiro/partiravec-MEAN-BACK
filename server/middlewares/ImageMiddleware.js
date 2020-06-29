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

const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require("../tools/environment.js");
const authenticationController = require('../controllers/AuthenticationController');

const ImageMiddleware = (req, res, next) => {
  // Get the token
  const token = req.query._token;

  if (!token) return res.status(403).json({error: "Vous n'êtes pas connecté"});

  // Verify the token and add a new one
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({error: "Vous avez été déconnecté"});
    authenticationController.currentUser = decoded.id;
    next();
  })
}

module.exports = ImageMiddleware
