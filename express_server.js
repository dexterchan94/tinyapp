const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

const generateRandomString = (length) => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    let char = characters[Math.floor((Math.random() * characters.length))];
    result += char;
  }
  return result;
};

const getUserByEmail = (users, email) => {
  for (const user in users) {
    if (users[user]["email"] === email) {
      return user;
    }
  }
  return false;
};

const urlsForUser = (id) => {
  const result = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url]["userID"] === id) {
      result[url] = urlDatabase[url];
    }
  }
  return result;
};



app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"],
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
      password: req.body.password
    };
    res.cookie("user_id", newUserID);
    console.log(users);
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"],
    users
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const currentLogin = getUserByEmail(users, req.body.email);
  if (!currentLogin) {
    res.status(403).send("That account does not exist!");
  } else if (users[currentLogin].password !== req.body.password) {
    res.status(403).send("Incorrect password!");
  } else {
    res.cookie("user_id", currentLogin);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});


app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.cookies["user_id"]),
    user_id: req.cookies["user_id"],
    users: users
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString(6);
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies["user_id"] };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    let templateVars = {
      user_id: req.cookies["user_id"],
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
    user_id: req.cookies["user_id"],
    users,
    urlDatabase
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL]["longURL"] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});


app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

