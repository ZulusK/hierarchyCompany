"use strict";

const AbstractDriver = require("./AbstractDriver");
const UserModel = require("@models").User;

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

    create({
        username,
        password
    }) {
        return super.create({
            username,
            password
        });
    }

    async createRootAdmin({
        username,
        password
    }) {
        // check, is root user exist
        return super.findOne({
                role: "root"
            }).then(rootAdmin => {
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
    set ROOT_ADMIN(value){
        const {password,username,id}=value;
        this._rootAdmin={password,username,id};
    }
    get ROOT_ADMIN(){
        return this._rootAdmin;
    }
}

module.exports = new UserDriver();