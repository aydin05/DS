var express = require("express");
const path = require("path");
var app = express();

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

// frameguard disabled — frontend is embedded in iframe by Tizen display app

// Hashed assets → cache forever (filename changes on rebuild)
app.use("/assets", express.static(path.join(rootPath, "assets"), {
  maxAge: "1y",
  immutable: true,
}));

// Everything else (including index.html) → no cache
app.use(express.static(rootPath, {
  maxAge: 0,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
  },
}));

// Missing assets after rebuild → 404 (not index.html)
app.all("/assets/*", (req, res) => {
  res.status(404).end();
});

// SPA fallback — all other routes get index.html
app.get("*", (req, res) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.resolve("build", "index.html"));
});
app.listen(port);
