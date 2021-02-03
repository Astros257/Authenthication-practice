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

//OAUTH
const GoogleStrategy = require("passport-google-oauth20").Strategy;

//mongoose-findorcreate
const findOrCreate = require("mongoose-findorcreate");

//encryption
//const encrypt = require("mongoose-encryption");

//hashing using md5
//const md5 = require('md5');

// //hashing using bcrypt
// const bcrypt = require("bcrypt");
// const saltrounds = 10;

const app = express();

//this is how get access to the varibles in the .env file
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
app.use(passport.initialize()); //setups passport for to use for authenthication
app.use(passport.session()); //telling passport to deal with the sessions

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//fixing deprecation warning
mongoose.set("useCreateIndex", true);

//schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
});

//this is what we will use to hash and salt passowrd and to save
//our users into out mongodb database
//will do alot of the heavy lifting for us
userSchema.plugin(passportLocalMongoose);

/*
will add the functionalitu of the functin from the OAuth findOrCreate 
to our code
*/
userSchema.plugin(findOrCreate);

//pluging for user schema that will add encryption
//userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

//model
const User = new mongoose.model("User", userSchema);

//usign passport in the app

/*
local strategy to authenticate users using their username passowrd and also to serialize and deseralize 
our users
*/
passport.use(User.createStrategy());

/*
the serialize and deseriallize are only necassary when using sessions.

when we seralize our user it create the cookie and stuffs the message namly our users identifactions into the cookie

when we desserialize it basically allows passport to crumble the cookie to discover the message inside which is who this user is.
*/
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

//OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo", //needs this to fix google api deprecation
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

//rendering teh home page where the user can go to the login page or the register page
app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

// rending the login page
app.get("/login", function (req, res) {
  res.render("login");
});

//rendering the register page
app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

/*
if the user needs to register we will create a new document and save it with the users information
 */
app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

/*will check our user database agains tthe users login ingormation inputed
and if it matches up againts the email then we check the password, once we have declared weather 
the information is correct we will show the secrets page to the user. */
app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.logIn(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

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
