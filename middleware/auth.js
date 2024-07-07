const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const consola = require("consola");
dotenv.config();

module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    consola.error("Token is not valid");
    res.status(401).json({ msg: "Token is not valid" });
  }
};
