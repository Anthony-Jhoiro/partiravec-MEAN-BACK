const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require("./environment.js");

module.exports = (token, successCallback, errorCallback) => {
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) errorCallback()
    successCallback(decoded);
  });
}
