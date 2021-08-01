const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    // const error = new Error("Not Authenticated.");
    // error.statusCode = 401;
    // throw error;
    req.isAuth = false;
    return next();
  }

  // const token = req.get("Authorization").split(" ")[1];
  const token = authHeader.split(" ")[1];
  console.log("TOKEN", token);

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, "somesupersecretsecret");
  } catch (err) {
    req.isAuth = false;
    return next();
  }

  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }

  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
};
