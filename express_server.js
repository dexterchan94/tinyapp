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

// DATA OBJECTS --------------------------------------------
const urlDatabase = {};

const users = {};

// ROUTES --------------------------------------------------
app.get("/", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});


// Redirect to URLs page if user is already logged in
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
  // Incomplete form
  if (req.body.email === "" || req.body.password === "") {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      error: "empty"
    };
    res.status(400).render("register", templateVars);

  // Account already exists
  } else if (getUserByEmail(users, req.body.email)) {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      error: "duplicate"
    };
    res.status(400).render("register", templateVars);

  // Success
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


// Redirect to URLs page if user is already logged in
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
  // Retrieve userID corresponding to email
  const currentLogin = getUserByEmail(users, req.body.email);

  // Account does not exist
  if (!currentLogin) {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      error: "account"
    };
    res.status(403).render("login", templateVars);

  // Incorrect password
  } else if (!bcrypt.compareSync(req.body.password, users[currentLogin].password)) {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      error: "password"
    };
    res.status(403).render("login", templateVars);

  // Success
  } else {
    req.session.user_id = currentLogin;
    res.redirect("/urls");
  }
});


// Delete current session cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


// List all URLs that were created by the current user
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.user_id, urlDatabase),
    user_id: req.session.user_id,
    users: users
  };
  res.render("urls_index", templateVars);
});


// Add new URL if the user is logged in
app.post("/urls", (req, res) => {
  if (users[req.session.user_id]) {
    const shortURL = generateRandomString(6);
    const newDate = (new Date()).toLocaleString("en-US", {timeZone: "America/Vancouver", timeZoneName: "short"});
    urlDatabase[shortURL] = { 
      longURL: req.body.longURL,
      userID: req.session.user_id,
      dateCreated: newDate,
      viewCount: 0,
      uniqueViews: 0,
      visitors: [],
      visitDates: []
    };
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


// Render 'Create new URL' page if user is logged in
app.get("/urls/new", (req, res) => {
  if (users[req.session.user_id]) {
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
  // The shortURL exists
  if (urlDatabase[req.params.shortURL]) {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]["longURL"],
      user_id: req.session.user_id,
      users,
      urlDatabase
    };
    res.render("urls_show", templateVars);
    
  // The shortURL does not exist
  } else {
    const templateVars = {
      user_id: req.session.user_id,
      users,
      urlDatabase
    };
    res.status(404).render("url_none", templateVars);
  }
});


// Update the shortURL if it was originally created by the logged in user
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


// Delete short URL if it was originally created by the logged in user
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


// Redirect to long URL
app.get("/u/:shortURL", (req, res) => {
  // Short URL exists
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL]["longURL"];

    // Increment total view count
    urlDatabase[req.params.shortURL]["viewCount"] += 1;

    // Increment unique view count if user has not visited that short URL before
    if (!urlDatabase[req.params.shortURL]["visitors"].includes(req.session.visitor_id)) {
      req.session.visitor_id = generateRandomString(6);
      urlDatabase[req.params.shortURL]["uniqueViews"] += 1;
    }

    // Store visitor cookie and time of visit in database
    const newDate = (new Date()).toLocaleString("en-US", {timeZone: "America/Vancouver", timeZoneName: "short"});
    urlDatabase[req.params.shortURL]["visitors"].push(req.session.visitor_id);
    urlDatabase[req.params.shortURL]["visitDates"].push(newDate);

    res.redirect(longURL);

  // Short URL does not exist
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
