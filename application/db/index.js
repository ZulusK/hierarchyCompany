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

mongoose.connection.on('connected', () => {
    log.info('MongoDB is connected');
});

mongoose.set('debug', config.get("isDev"));

module.exports.connect = connectWithRetry;