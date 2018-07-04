const BasicStrategy = require("passport-http").BasicStrategy;
const UserDriver = require("@db").UserDriver;

module.exports = new BasicStrategy(async (username, password, done) => {
    const user = await UserDriver.getByCredentials(username, password);
    if (user) {
        return done(null, user);
    } else {
        return done(undefined, false, {message: "Invalid email or password."});
    }
});