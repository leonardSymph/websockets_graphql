const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");

// mongoose
const mongoose = require("mongoose");

// multer
const multer = require("multer");
// uuid for multer on windows
const { v4: uuidv4 } = require("uuid");

// GRAPHQL
const { graphqlHTTP } = require("express-graphql");

// cors
const cors = require("cors");

// GRAPHQL SCHEMA && RESOLVERS
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");

// Auth
const auth = require("./middleware/auth");

// clear-file util
const { clearImage } = require("./util/file");

const app = express();

// fileStorage for multer
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + "-" + file.originalname);
  },
});

// fileFilter for multer
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded({extended:true})); // xx-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json

// pass multer middleware after the bodyParser
app.use(
  multer({
    storage: fileStorage,
    fileFilter: fileFilter,
  }).single("image")
);

// for images
app.use("/images", express.static(path.join(__dirname, "images")));

// middleware for CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// // alternative middleware for cors
// app.use(cors());

// middleware for auth
app.use(auth);

// classic end-point to send image
app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    throw new Error("User is not authenticated.");
  }
  if (!req.file) {
    return res.status(200).json({ message: "No file provided." });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res.status(201).json({
    message: "File stored.",
    filePath: req.file.path.replace(/\\/g, "/"),
  });
});

// GRAPHQL middleware
app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }

      const data = err.originalError.data;
      const code = err.originalError.code || 500;
      const message = err.originalError.message || "An error occured";

      return { message: message, status: code, data: data };
    },
  })
);

// error-handling
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 5000;
  const message = error.message;
  const data = error.data;

  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(
    "mongodb://leonard:testpassword@cluster0-shard-00-00.qutsm.mongodb.net:27017,cluster0-shard-00-01.qutsm.mongodb.net:27017,cluster0-shard-00-02.qutsm.mongodb.net:27017/messages?ssl=true&replicaSet=atlas-smk727-shard-0&authSource=admin&retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then((result) => {
    console.log("Connected to mongodb");
    app.listen(8080);
  })
  .catch((err) => {
    console.log(err);
  });
