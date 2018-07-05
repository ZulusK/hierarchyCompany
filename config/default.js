// function generateURL() {
//     const url = process.env.DB_URL || "";
//     const login = process.env.DB_LOGIN;
//     const password = process.env.DB_PASSWORD;
//     return url.replace("<login>", login).replace("<psw>", password);
// }
const path = require("path");
const bcrypt = require("bcrypt");

module.exports = {
    DB: {
        URL: process.env.DB_URL,
        AUTH_OPT: {
            user: process.env.DB_LOGIN,
            pass: process.env.DB_PASSWORD,
            reconnectTries: 30
        }
    },
    isDev: false,
    LOG_LEVEL: "info",
    PUBLIC_DIR: path.join(__dirname, "../public"),
    MAX_PAGINATION: 100,
    STANDARD_PAGINATION: 10,
    PASSWORD_SALT_LENGTH: 10,
    TOKEN_SECRET_SALT_LENGTH: 5,
    TOKEN_SALT_ACCESS: process.env.TOKEN_SALT_ACCESS,
    TOKEN_SALT_REFRESH: process.env.TOKEN_SALT_REFRESH,
    TOKEN_LIFE_ACCESS: 1e3 * 60 * 60, // 1 hour
    TOKEN_LIFE_REFRESH: 1e3 * 60 * 60 * 24, // 1 day
    TOKEN_GENERATOR_ALGORITHM: "HS256",
    validationRules: {
        username: {
            length: {
                max: 20,
                min: 3
            },
        },
        password: {
            length: {
                min: 8,
                max: 16
            },
            regExp: /^(?=.*\d.*)(?=.*[a-z].*)(?=.*[A-Z].*)(?=.*[!#$%&?]*.*).{8,16}$/
        }
    },
    ROOT_ADMIN: {
        username: process.env.ROOT_ADMIN_USERNAME || bcrypt.genSaltSync(8),
        password: process.env.ROOT_ADMIN_PASSWORD || bcrypt.genSaltSync(16),
    },
};