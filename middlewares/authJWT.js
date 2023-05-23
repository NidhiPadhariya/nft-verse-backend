const jwt = require("jsonwebtoken");
user = require("../models/user");
var config = require("../config").config;

const verifyToken = (req, res, next) => {
  console.log("before try auth");
  console.log(req.headers.authorization, "auth");
  try {
    var token
    if(req.headers["authorization"].split(" ")[1] == undefined){
      token = req.headers["authorization"].split(" ")[0];
    } else {
      token = req.headers["authorization"].split(" ")[1];
    }
    console.log(token, "token from auth");
    var tokenfinal = token.replaceAll('"', '');
    console.log(tokenfinal);
    
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
    let decoded = jwt.verify(tokenfinal, config.secret);
    console.log(decoded, "decoded token");
    req.body.id = decoded.id;
    next();
  }
  catch (err) {
    res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
  }
};

module.exports = verifyToken;