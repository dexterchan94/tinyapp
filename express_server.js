const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers.js');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  secret: "v2sg1w",
  maxAge: 24 * 60 * 60 * 1000
}));
app.use(methodOverride('_method'))
app.set("view engine", "ejs");

// DATA OBJECTS ------------------------------------
const urlDatabase = {};

const users = {};

// ROUTES -----------------------------------
app.get("/", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/register", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      error: ""
    };
    res.render("register", templateVars);
  }
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      error: "empty"
    };
    res.status(400).render("register", templateVars);
  } else if (getUserByEmail(users, req.body.email)) {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      error: "duplicate"
    };
    res.status(400).render("register", templateVars);
  } else {
    const newUserID = generateRandomString(6);
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
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      error: ""
    };
    res.render("login", templateVars);
  }
});

app.post("/login", (req, res) => {
  const currentLogin = getUserByEmail(users, req.body.email);
  if (!currentLogin) {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      error: "account"
    };
    res.status(403).render("login", templateVars);
  } else if (!bcrypt.compareSync(req.body.password, users[currentLogin].password)) {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      error: "password"
    };
    res.status(403).render("login", templateVars);
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
  const templateVars = {
    urls: urlsForUser(req.session.user_id, urlDatabase),
    user_id: req.session.user_id,
    users: users
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    const shortURL = generateRandomString(6);
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
    res.redirect(`/urls/${shortURL}`);
  } else {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      urlDatabase
    };
    res.status(401).render("unauthorized", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = {
      user_id: req.session.user_id,
      users
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]["longURL"],
      user_id: req.session.user_id,
      users,
      urlDatabase
    };
    res.render("urls_show", templateVars);
  } else {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      urlDatabase
    };
    res.status(404).render("url_none", templateVars);
  }
});

app.put("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    urlDatabase[req.params.shortURL]["longURL"] = req.body.longURL;
    res.redirect("/urls");
  } else {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      urlDatabase
    };
    res.status(401).render("unauthorized", templateVars);
  }
});

app.delete("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      urlDatabase
    };
    res.status(401).render("unauthorized", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL]["longURL"];
    res.redirect(longURL);
  } else {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      urlDatabase
    };
    res.status(404).render("url_none", templateVars);
  }
});


app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
