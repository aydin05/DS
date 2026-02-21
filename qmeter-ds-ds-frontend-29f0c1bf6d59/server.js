var express = require("express");
const path = require("path");
var app = express();
const helmet = require("helmet");

var port = process.env.PORT || 3333;
var rootPath = path.normalize(__dirname + "/build");

var allowCrossDomain = function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Requested-With, Authorization",
  );
  if (req.method === "OPTIONS") res.send(200);
  else next();
};

app.use(function (req, res, next) {
  allowCrossDomain(req, res, next);
});

app.use(helmet.frameguard());
app.use(express.static(rootPath));
app.get("*", (req, res) => res.sendFile(path.resolve("build", "index.html")));
app.listen(port);
