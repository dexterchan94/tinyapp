const assert = require("chai").assert;

const { getUserByEmail, generateRandomString, urlsForUser } = require('../helpers.js');

const testUsers = {
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
};

describe("getUserByEmail", () => {

  it("should return a user with a valid email", () => {
    const user = getUserByEmail(testUsers, "user@example.com");
    const expectedOutput = "userRandomID";
    assert.strictEqual(user, expectedOutput);
  });

  it("should return undefined with an invalid email", () => {
    const user = getUserByEmail(testUsers, "ghost@example.com");
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput);
  });

});
