const chai = require("chai");
const expect = chai.expect;
const server = require("@server");
const faker = require("faker");
const UserModel = require("@db").UserDriver.model;
const URL = "/user/signin";
const URL_SIGNUP = "/user/signup";

const config = require("@config");


function generateUser() {
    return {
        username: faker.name.firstName() + Math.floor(Math.random() * 1000),
        password: "1Am$23s" + Math.floor(Math.random() * 10000)
    };
}


describe("/signin", () => {
    let USER = null;
    let STORED_USER = null;
    before((done) => {
        UserModel.remove({}).exec().then(() => {
            USER = generateUser();
            chai.request(server)
                .post(URL_SIGNUP)
                .send(USER)
                .end((err, res) => {
                    STORED_USER = res.body.user;
                    done(err)
                });
        });
    });
    after((done) => {
        UserModel.remove({}, err => {
            done(err)
        });
    });
    describe(" valid username and psw", () => {
        it("should return user, associated with received credentials", (done) => {
            chai.request(server)
                .post(URL)
                .auth(USER.username, USER.password)
                .end((err, res) => {
                    expect(res).have.status(200);
                    expect(res.body).to.have.all.keys(["user", "tokens"]);
                    expect(res.body.user).to.have.all.keys(["username", "createdAt", "updatedAt", "id"]);
                    expect(res.body.user.username).to.equal(STORED_USER.username);
                    expect(res.body.user.id).to.be.a("string").that.equal(String(STORED_USER.id));
                    done();
                });
        });
        it("should return access and refresh tokens", (done) => {
            chai.request(server)
                .post(URL)
                .auth(USER.username, USER.password)
                .end((err, res) => {
                    expect(res).have.status(200);
                    expect(res.body.tokens).to.have.all.keys(["accessToken", "refreshToken"]);
                    expect(res.body.tokens.accessToken).to.have.all.keys(["token", "expiredIn"]);
                    expect(res.body.tokens.refreshToken).to.have.all.keys(["token", "expiredIn"]);
                    expect(res.body.tokens.accessToken.token).to.be.a("string");
                    expect(res.body.tokens.refreshToken.token).to.be.a("string");
                    expect(res.body.tokens.token).to.not.be.equal(res.body.tokens.refreshToken.token);
                    done();
                });
        });
    });
    describe(" invalid username", () => {
        it("should return error, username is not present", (done) => {
            let user = {password: generateUser().password};
            chai.request(server)
                .post(URL)
                .auth(user.username, user.password)
                .end((err, res) => {
                    expect(res).have.status(401);
                    done();
                });
        });
        it("should return error, invalid symbols", (done) => {
            let user = generateUser();
            user.username = "!2LMSLm";
            chai.request(server)
                .post(URL)
                .auth(user.username, user.password)
                .end((err, res) => {
                    expect(res).have.status(401);
                    done();
                });
        });
        it("should return error, invalid length, >20", (done) => {
            let user = generateUser();
            user.username = "2LMSLmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
            chai.request(server)
                .post(URL)
                .auth(user.username, user.password)
                .end((err, res) => {
                    expect(res).have.status(401);
                    done();
                });
        });
        it("should return error, invalid length <3", (done) => {
            let user = generateUser();
            user.username = "ab";
            chai.request(server)
                .post(URL)
                .auth(user.username, user.password)
                .end((err, res) => {
                    expect(res).have.status(401);
                    done();
                });
        });
    });
    describe(" invalid password", () => {
        it("should return error, username is not present", (done) => {
            let user = {username: generateUser().username};
            chai.request(server)
                .post(URL)
                .auth(user.username, user.password)
                .end((err, res) => {
                    expect(res).have.status(401);
                    done();
                });
        });
        it("should return error, invalid symbols", (done) => {
            let user = generateUser();
            user.password = " sdsodnosm!nxal";
            chai.request(server)
                .post(URL)
                .auth(user.username, user.password)
                .end((err, res) => {
                    expect(res).have.status(401);
                    done();
                });
        });
        it("should return error, invalid length, >16", (done) => {
            let user = generateUser();
            user.password = "2L#MSLmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaddsdadaaaaaaaaaaaa";
            chai.request(server)
                .post(URL)
                .auth(user.username, user.password)
                .end((err, res) => {
                    expect(res).have.status(401);
                    done();
                });
        });
        it("should return error, invalid length <8", (done) => {
            let user = generateUser();
            user.password = "ab";
            chai.request(server)
                .post(URL)
                .auth(user.username, user.password)
                .end((err, res) => {
                    expect(res).have.status(401);
                    done();
                });
        });
    })
});
