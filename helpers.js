const getUserByEmail = (users, email) => {
  for (const user in users) {
    if (users[user]["email"] === email) {
      return user;
    }
  }
  return undefined;
};

const generateRandomString = (length) => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    let char = characters[Math.floor((Math.random() * characters.length))];
    result += char;
  }
  return result;
};

const urlsForUser = (id, database) => {
  const result = {};
  for (const url in database) {
    if (database[url]["userID"] === id) {
      result[url] = database[url];
    }
  }
  return result;
};


module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser
};