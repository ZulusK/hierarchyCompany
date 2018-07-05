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
});

const UserDriver = module.exports.UserDriver;

async function buildConnections() {
    const a = await UserDriver.findOne({
        username: "A"
    });
    const b = await UserDriver.findOne({
        username: "B"
    });
    const c = await UserDriver.findOne({
        username: "C"
    });
    const e = await UserDriver.findOne({
        username: "E"
    });
    const f = await UserDriver.findOne({
        username: "F"
    });
    const g = await UserDriver.findOne({
        username: "G"
    });
    await UserDriver.addWorker({boss: a, worker: b});
    await UserDriver.addWorker({boss: b, worker: c});
    await UserDriver.addWorker({boss: b, worker: e});
    await UserDriver.addWorker({boss: e, worker: f});
    await UserDriver.addWorker({boss: a, worker: g});
    try {
        log.debug("Try to make circular connection: E->A");
        await UserDriver.addWorker({boss: e, worker: a});
        throw new Error("This is unbelievable, check this code");
    } catch (e) {
        log.error("Next error is required");
        log.error(e);
        log.debug("All is ok");
    }
    await UserDriver.removeWorkerFromOldBoss(c);
}

async function check(b, w) {
    const W = await UserDriver.findOne({
        username: w
    });
    const B = await UserDriver.findOne({
        username: b
    });
    log.info(`${b} -> ${w} ${await UserDriver.isBossOf({boss: B, worker: W})}`)
}

async function checkIsBossOf() {
    for (let b = 0; b < 7; b++) {
        for (let w = 0; w < 7; w++) {
            await check(String.fromCharCode("A".charCodeAt(0) + b), String.fromCharCode("A".charCodeAt(0) + w))
        }
    }
}

async function fillDB() {
    for (let i = 0; i < 7; i++) {
        await module.exports.UserDriver.create({
            username: String.fromCharCode(i + "A".charCodeAt(0)),
            password: String.fromCharCode(i + "A".charCodeAt(0))
        });
    }
}

async function addAdmins() {
    await module.exports.UserDriver.create({
        username:"admin",
        password:"admin",
        isAdmin: true,
    });
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
        log.debug(`root admin created/updated ${username}:${password}, id:${rootAdmin.id}`);
        if (config.get("isDev")) {
            // add users

            await fillDB();
            await addAdmins();
            await buildConnections();
            await checkIsBossOf();
        }
    } catch (err) {
        log.error(err);
        throw err;
    }
});

// mongoose.set('debug', config.get("isDev"));

module.exports.connect = connectWithRetry;


