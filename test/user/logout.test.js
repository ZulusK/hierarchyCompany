const chai = require("chai");
const expect = chai.expect;
const server = require("@server");
const faker = require("faker");
const UserModel = require("@db").UserDriver.model;
const URL = "/user/logout";
const URL_SIGNUP = "/user/signup";
const URL_SIGNIN = "/user/signin";
const PRIVATE_URL = "/user/logout";
const config = require("@config");

const rules = config.get("validationRules");

function generateUser() {
    return {
        username: faker.name.firstName() + Math.floor(Math.random() * 1000),
        password: "1Am$23s" + Math.floor(Math.random() * 10000)
    };
}


describe("/logout", () => {
    let USER = null;
    let TOKEN_ACCESS = null;
    let TOKEN_REFRESH = null;

    before((done) => {
        UserModel.remove({}).exec().then(() => {
            USER = generateUser();
            chai.request(server)
                .post(URL_SIGNUP)
                .send(USER)
                .end((err, res) => {
                    TOKEN_ACCESS = res.body.accessToken;
                    TOKEN_REFRESH = res.body.refreshToken;
                    done(err)
                });
        });
    });
    after((done) => {
        UserModel.remove({}, err => done(err));
    });
    beforeEach((done) => {
        chai.request(server)
            .post(URL_SIGNIN)
            .auth(USER.username, USER.password)
            .end((err, res) => {
                TOKEN_ACCESS = res.body.tokens.accessToken;
                TOKEN_REFRESH = res.body.tokens.refreshToken;
                done(err)
            });
    });
    describe("valid username and psw", () => {
        it("should return status 200", (done) => {
            chai.request(server)
                .post(URL)
                .auth(USER.username, USER.password)
                .end((err, res) => {
                    expect(res).have.status(200);
                    done();
                });
        });
        it("old tokens is outdated", (done) => {
            // logout
            chai.request(server)
                .post(URL)
                .auth(USER.username, USER.password)
                .end((err, res) => {
                    // try to get access to private url using old tokens
                    chai.request(server)
                        .post(PRIVATE_URL)
                        .auth(USER.username, USER.password)
                        .set("authorization", `Bearer ${TOKEN_ACCESS.token}`)
                        .end((err, res) => {
                            expect(res).have.status(401);
                            done();
                        });
                });
        });
    });
    describe("valid access token", () => {
        it("should return status 200", (done) => {
            chai.request(server)
                .post(URL)
                .set("authorization", `Bearer ${TOKEN_ACCESS.token}`)
                .end((err, res) => {
                    expect(res).have.status(200);
                    done();
                });
        });
        it("old tokens is outdated", (done) => {
            // logout
            chai.request(server)
                .post(URL)
                .set("authorization", `Bearer ${TOKEN_ACCESS.token}`)
                .end((err, res) => {
                    // try to get access to private url using old tokens
                    chai.request(server)
                        .post(PRIVATE_URL)
                        .auth(USER.username, USER.password)
                        .set("authorization", `Bearer ${TOKEN_ACCESS.token}`)
                        .end((err, res) => {
                            expect(res).have.status(401);
                            done();
                        });
                });
        });
    });
    describe("invalid used refresh token", () => {
        it("should return status 401", (done) => {
            chai.request(server)
                .post(URL)
                .set("authorization", `Bearer ${TOKEN_REFRESH.token}`)
                .end((err, res) => {
                    expect(res).have.status(401);
                    done();
                });
        });
        it("old tokens is not outdated", (done) => {
            // logout
            chai.request(server)
                .post(URL)
                .set("authorization", `Bearer ${TOKEN_REFRESH.token}`)
                .end((err, res) => {
                    // try to get access to private url using old tokens
                    chai.request(server)
                        .post(PRIVATE_URL)
                        .set("authorization", `Bearer ${TOKEN_ACCESS.token}`)
                        .end((err, res) => {
                            expect(res).have.status(200);
                            done();
                        });
                });
        });
    });
    describe("invalid username", () => {
        it("should return error, username is not present", (done) => {
            chai.request(server)
                .post(URL)
                .auth(undefined, USER.password)
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
                .auth(user.username, USER.password)
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
                .auth(USER.username, user.password)
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
                .auth(USER.username, user.password)
                .end((err, res) => {
                    expect(res).have.status(401);
                    done();
                });
        });
    })
});
