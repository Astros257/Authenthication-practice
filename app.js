//jshint esversion:6
require("dotenv").config(); //only to require it does not need a constatn must be at the top
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

//cookies and sessions
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//encryption
//const encrypt = require("mongoose-encryption");

//hashing using md5
//const md5 = require('md5');

// //hashing using bcrypt
// const bcrypt = require("bcrypt");
// const saltrounds = 10;

const app = express();

//this is how get access to the varibles in teh .env file
//console.log(process.env.SECRET);

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

//cookies and sessions
app.use(
  session({
    secret: "our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

//pluging for user schema that will add encryption
//userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

//model
const User = new mongoose.model("User", userSchema);

//rendering teh home page where the user can go to the login page or the register page
app.get("/", function (req, res) {
  res.render("home");
});

// rending the login page
app.get("/login", function (req, res) {
  res.render("login");
});

//rendering the register page
app.get("/register", function (req, res) {
  res.render("register");
});

/*
if the user needs to register we will create a new document and save it with the users information
 */
app.post("/register", function (req, res) {});

/*will check our user database agains tthe users login ingormation inputed
and if it matches up againts the email then we check the password, once we have declared weather 
the information is correct we will show the secrets page to the user. */
app.post("/login", function (req, res) {});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

/*
*************************Notes***************************
with encryption the password is securea as long as no one knows about the key to
decrypt the password.

but  with hashing they cannot reverse the hash but that does not mean hackers
cant hack users passwords.
*/
