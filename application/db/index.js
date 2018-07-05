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
    await UserDriver.addWorker(a, b);
    await UserDriver.addWorker(b, c);
    await UserDriver.addWorker(b, e);
    await UserDriver.addWorker(e, f);
    await UserDriver.addWorker(a, g);
    await UserDriver.removeWorkerFromOldBoss(c);
    log.info(`boss of A: ${a.boss}`)
    log.info(`boss of B: ${b.boss}`)
    log.info(`boss of C: ${c.boss}`)
    log.info(`id of A: ${a.id}`)
    log.info(`id of B: ${b.id}`)
    log.info(`id of c: ${c.id}`)
}

async function check(b,w){
    const W = await UserDriver.findOne({
        username: w
    });
    const B = await UserDriver.findOne({
        username: b
    });
    log.info(`${b} -> ${w} ${await UserDriver.isBossOf(B,W)}`)
}
async function checkIsBossOf(){
    for(let b=0; b<7;b++) {
        for (let w = 0; w < 7; w++) {
            await check(String.fromCharCode("A".charCodeAt(0) + b), String.fromCharCode("A".charCodeAt(0) + w))
        }
    }
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
        for(let i=0; i<10;i++){
            await module.exports.UserDriver.create({
                username: String.fromCharCode(i+"A".charCodeAt(0)),
                password: String.fromCharCode(i+"A".charCodeAt(0))
            });
        }
        log.debug(`root admin created/updated ${username}:${password}, id:${rootAdmin.id}`);
        await buildConnections();
        await checkIsBossOf();
    } catch (err) {
        log.error(err);
        throw err;
    }
});

mongoose.set('debug', config.get("isDev"));



module.exports.connect = connectWithRetry;