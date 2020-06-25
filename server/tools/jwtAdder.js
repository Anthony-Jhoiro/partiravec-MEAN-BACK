const jwt = require("jsonwebtoken");
const {JWT_SECRET} = require("./environment.js");

/**
 * Add a jwt token to the response
 * @param res
 * @param data
 */
const addJwtToken = (res, data) =>{
  const token = jwt.sign(data, JWT_SECRET, {expiresIn: 3600});
  res.set('_token', token);
} ;

module.exports = addJwtToken;
