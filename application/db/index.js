"use strict";
const utils = require("@utils");
const mongoose = require("mongoose");
const bluebird = require("bluebird");
const log = require("@utils").logger(module);
const config = require("@config");

utils.buildIndexFile(__dirname, module);
mongoose.Promise = bluebird;


// configure and connect to DB
// Retry connection
function connectWithRetry() {
    log.debug(`Try to connect to ${config.get("DB.URL")} with params ${JSON.stringify(config.get("DB.AUTH_OPT"))}`);
    return mongoose.connect(config.get("DB.URL"), config.get("DB.AUTH_OPT"))
}

// Exit application on error
mongoose.connection.on('error', err => {
    log.error(`MongoDB connection error: ${err}`);
    setTimeout(connectWithRetry, 5000);
    // process.exit(-1)
});


mongoose.connection.on('connected', async () => {
    log.info('MongoDB is connected');
    try {
        const {
            rootAdmin,
            username,
            password
        } = await module.exports.UserDriver.createRootAdmin(config.get("ROOT_ADMIN"));
        module.exports.UserDriver.ROOT_ADMIN = {username,password,id:rootAdmin._id};
        
        log.debug(`root admin created/updated ${username}:${password}, id:${rootAdmin.id}`);
    } catch (err) {
        log.error(err);
        throw err;
    }
});

mongoose.set('debug', config.get("isDev"));



module.exports.connect = connectWithRetry;