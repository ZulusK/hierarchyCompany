"use strict";

const _ = require("lodash");
const AbstractDriver = require("./AbstractDriver");
const UserModel = require("@models").User;
const log = require("@utils").logger(module);
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

class UserDriver extends AbstractDriver {
    constructor() {
        super(UserModel)
    }

    async getByCredentials(username, password) {
        const user = await this.findOne({
            username
        });
        if (user && await user.comparePassword(password)) {
            return user;
        }
        return null;
    }

    async getByToken(kind, token) {
        const user = await this.findById(token.id);
        if (!user) return null;
        if (user.jwtSecrets[kind] === token.salt) {
            return user;
        } else {
            return null;
        }
    }

    create({username, password, isAdmin}) {
        if (isAdmin) {
            return super.create({
                username,
                password,
                role: "admin",
                boss: null
            });
        } else {
            return super.create({
                username,
                password,
                role: "user",
                boss: ObjectId(this.ROOT_ADMIN.id)
            });
        }

    }

    async createRootAdmin({username, password}) {
        // check, is root user exist
        return super.findOne({
            role: "root"
        })
            .then(rootAdmin => {
                // if exist
                if (rootAdmin) {
                    // update  password
                    rootAdmin.password = password;
                    //return super user
                    return rootAdmin.save();
                } else {
                    // esle create new user with specified fields
                    return super.create({
                        username,
                        password,
                        role: "root"
                    });
                }
            })
            .then(rootAdmin => {
                return {
                    rootAdmin,
                    username: rootAdmin.username,
                    password
                };
            })
    }

    set ROOT_ADMIN(value) {
        const {
            password,
            username,
            id
        } = value;
        this._rootAdmin = {
            password,
            username,
            id
        };
    }

    get ROOT_ADMIN() {
        return this._rootAdmin;
    }

    /**
     * PROCESS RELATIONS WITH OLD BOSS
     */
    async removeWorkerFromOldBoss(worker) {
        let oldBoss = null;
        if (worker.boss && worker.boss.str !== this.ROOT_ADMIN.id.str) {
            oldBoss = await super.findById(worker.boss);
        }
        // decrease old boss's count of workers
        if (oldBoss) {
            oldBoss.countOfWorkers--;
            await oldBoss.save();
        }
    }

    /**
     * PROCESS RELATIONS WITH NEW BOSS
     */
    async addWorkerToBoss({worker, boss}) {
        if (boss && boss.id !== this.ROOT_ADMIN.id) {
            if (worker.id === boss.id) {
                throw new Error("Try to build ciclic connections");
            }
            worker.boss = boss.id;
            boss.countOfWorkers++;
            return Promise.all([worker.save(), boss.save()]);
        } else {
            worker.boss = this.ROOT_ADMIN.id;
            return worker.save();
        }
    }

    async addWorker({boss, worker}) {
        if(boss){
            // check for circular connections
            const firstLvlChildren=await this.getFields({boss:worker.id},{id:1,username:1});
            const connections=await Promise.all(firstLvlChildren.map(c=>{
                return this.isBossOf({boss:c, worker:boss});
            }));
            if(connections.indexOf(true)>=0){
                throw new Error("You try to make circular connection")
            }
        }
        await this.removeWorkerFromOldBoss(worker);
        await this.addWorkerToBoss({boss, worker});
    }

    async isBossOf({boss, worker}) {
        let bossId=null;
        let workerId=null;
        if (boss) {
            bossId = boss._id;
        } else {
            throw Error("Boss is required")
        }
        // admin is boss of everyone
        if (boss.isAdmin) {
            return true;
        }
        if (worker) {
            workerId = worker._id;
        }else{
            throw Error("Worker is required")
        }
        // user is not boss of himself
        if (bossId === workerId) {
            return false;
        }
        // boss is admin, so he is boss for everyone
        if (!boss.boss) {
            return true;
        }
        // else search boss of boss
        const bossOfBoss = await this.findById(boss.boss);
        return this._model.aggregate()
            .match({_id: workerId})
            .graphLookup({
                from: "users",
                startWith: "$boss",
                connectFromField: "boss",
                connectToField: "_id",
                as: 'connections',
                restrictSearchWithMatch: {
                    "_id": {"$ne": bossOfBoss._id}
                },
            })
            .project({
                _id: 1,
                steps: 1,
                username:1,
                connections:"$connections._id",
            })
            .exec()
            .then((result) => {
                if (result.length>0) {
                    return false;
                }
                return result[0].connections.indexOf(String(bossId)) >= 0;
            })
    }

    get publicFields() {
        return {
            id: 1,
            username: 1,
            createdAt: 1,
            updatedAt: 1,
            boss: 1,
            isAdmin: 1,
            isBoss: 1
        }
    }

    async getSubordinates(boss) {
        let queue = [boss];
        const result = [];
        while (queue.length>0) {
            const currUser = queue.shift();
            result.push(currUser.publicInfo||currUser);
            queue = queue.concat(await this.getFields({boss: currUser.id},this.publicFields));
        }
        return result;
    }
}

module.exports = new UserDriver();