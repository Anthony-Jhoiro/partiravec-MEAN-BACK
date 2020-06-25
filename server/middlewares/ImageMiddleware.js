const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require("../tools/environment.js");
const addJwtToken =  require("../tools/jwtAdder.js");
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
