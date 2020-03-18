const express = require("express");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers.js');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  secret: "v2sg1w",
  maxAge: 24 * 60 * 60 * 1000
}));
app.set("view engine", "ejs");

// DATA OBJECTS ------------------------------------
const urlDatabase = {
  // "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  // "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

const users = {};


// ROUTES -----------------------------------
app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  let templateVars = {
    user_id: req.session.user_id,
    users
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Must enter an email and password!");
  } else if (getUserByEmail(users, req.body.email)) {
    res.status(400).send("Account already exists!");
  } else {
    let newUserID = generateRandomString(6);
    users[newUserID] = {
      id: newUserID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = newUserID;
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  let templateVars = {
    user_id: req.session.user_id,
    users
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const currentLogin = getUserByEmail(users, req.body.email);
  if (!currentLogin) {
    res.status(403).send("That account does not exist!");
  } else if (!bcrypt.compareSync(req.body.password, users[currentLogin].password)) {
    res.status(403).send("Incorrect password!");
  } else {
    req.session.user_id = currentLogin;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id, urlDatabase),
    user_id: req.session.user_id,
    users: users
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      user_id: req.session.user_id,
      users
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }

});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]["longURL"],
    user_id: req.session.user_id,
    users,
    urlDatabase
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    urlDatabase[req.params.shortURL]["longURL"] = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(401).send("You do not have permission to edit this URL");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(401).send("You do not have permission to delete this URL");
  }
});


app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

