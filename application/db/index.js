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
const UserDriver = module.exports.UserDriver;

async function start() {
    const a = await UserDriver.findOne({
        username: "A"
    });
    const b = await UserDriver.findOne({
        username: "B"
    });
    const c = await UserDriver.findOne({
        username: "C"
    });
    const r = await UserDriver.findOne({
        role: "root"
    });
    await UserDriver.addWorker(a, b);
    await UserDriver.removeWorkerFromOldBoss(c);
    log.info(`boss of A: ${a.boss}`)
    log.info(`boss of B: ${b.boss}`)
    log.info(`boss of C: ${c.boss}`)
    log.info(`id of A: ${a.id}`)
    log.info(`id of B: ${b.id}`)
    log.info(`id of c: ${c.id}`)
}


mongoose.connection.on('connected', async () => {
    log.info('MongoDB is connected');
    await mongoose.model("User").remove({}).exec();
    try {
        const {
            rootAdmin,
            username,
            password
        } = await module.exports.UserDriver.createRootAdmin(config.get("ROOT_ADMIN"));
        module.exports.UserDriver.ROOT_ADMIN = {
            username,
            password,
            id: rootAdmin._id
        };
        await module.exports.UserDriver.create({
            username: "A",
            password: "A"
        });
        await module.exports.UserDriver.create({
            username: "B",
            password: "B"
        });
        await module.exports.UserDriver.create({
            username: "C",
            password: "C"
        });
        log.debug(`root admin created/updated ${username}:${password}, id:${rootAdmin.id}`);
        await start();
    } catch (err) {
        log.error(err);
        throw err;
    }
});

mongoose.set('debug', config.get("isDev"));



module.exports.connect = connectWithRetry;