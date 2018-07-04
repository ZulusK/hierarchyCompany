"use strict";

const AbstractDriver = require("./AbstractDriver");
const UserModel = require("@models").User;

class UserDriver extends AbstractDriver {
    constructor() {
        super(UserModel)
    }

    async getByCredentials(username, password) {
        const user = await this.findOne({username});
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

    create({username, password}) {
        return super.create({username, password});
    }
    getPublicFields(doc){
        const {username,_id:id,createdAt,updatedAt}=doc;
        return {username,id,createdAt,updatedAt};
    }
}

module    .exports = new UserDriver();