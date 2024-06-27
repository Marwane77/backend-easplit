require("dotenv").config();
//const fileUpload = require("express-fileupload");

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

require("./models/connection");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var eventsRouter = require("./routes/events");
var transactionsRouter = require("./routes/transactions");

var app = express();

const cors = require("cors");
app.use(cors());

const fileUpload = require("express-fileupload");
app.use(fileUpload());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/events", eventsRouter);
app.use("/transactions", transactionsRouter);

module.exports = app;
