const chai = require("chai");
const expect = chai.expect;
const server = require("@server");
const faker = require("faker");
const UserModel = require("@db").UserDriver.model;
const URL = "/user/signup";
const ObjectId = require("mongoose").Types.ObjectId;
const config=require("@config");

const rules=config.get("validationRules");

function generateUser() {
    return {
        username: faker.name.firstName() + Math.floor(Math.random() * 1000),
        password: "1Am$23s"+ Math.floor(Math.random() * 10000)
    };
}

describe("/signup", () => {
    beforeEach((done) => {
        UserModel.remove({}, err => done(err));
    });
    after((done) => {
        UserModel.remove({}, err => {
            done(err)
        });
    });
    describe("Send valid username and psw", () => {
        it("should create user, with specified valid fields", (done) => {
            let user = generateUser();
            chai.request(server)
                .post(URL)
                .send(user)
                .end(async (err, res) => {
                    const storedUser=await UserModel.findOne({username:user.username});
                    expect(res).have.status(200);
                    expect(res.body).to.have.all.keys(["user", "tokens"]);
                    expect(res.body.user).to.have.all.keys(["username", "createdAt", "updatedAt", "id"]);
                    expect(res.body.user.username).to.equal(user.username);
                    expect(res.body.user.username).to.equal(storedUser.username);
                    expect(res.body.user.id).to.be.a("string");
                    expect(res.body.user.id).to.equal(String(storedUser._id));
                    expect(ObjectId.isValid(res.body.user.id)).to.be.true;
                    done();
                });
        });
        it("should return access and refresh tokens", (done) => {
            let user = generateUser();
            chai.request(server)
                .post(URL)
                .send(user)
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
        it("should encrypt password", (done) => {
            let user = generateUser();
            chai.request(server)
                .post(URL)
                .send(user)
                .end(async () => {
                    let createdUser = await UserModel.findOne({username: user.username}).exec();
                    expect(createdUser).to.have.property("password");
                    expect(createdUser.password).to.be.a("string");
                    expect(createdUser.password).to.be.not.empty;
                    expect(createdUser.password).to.be.not.equal(user.password);
                    done();
                });
        });
    });
    describe("send invalid username", () => {
        it("should return error, username is not present", (done) => {
            let user = {password: generateUser().password};
            chai.request(server)
                .post(URL)
                .send(user)
                .end((err, res) => {
                    expect(res).have.status(400);
                    expect(res.body).to.have.all.keys(["errors"]);
                    expect(res.body.errors).to.have.key("username");
                    expect(res.body.errors.username.msg).to.be.equal("username is required");
                    done();
                });
        });
        it("should return error, invalid symbols", (done) => {
            let user = generateUser();
            user.username = "!2LMSLm";
            chai.request(server)
                .post(URL)
                .send(user)
                .end((err, res) => {
                    expect(res).have.status(400);
                    expect(res.body).to.have.all.keys(["errors"]);
                    expect(res.body.errors).to.have.key("username");
                    expect(res.body.errors.username.msg).to.be.equal("username must contain only letters and numbers");
                    done();
                });
        });
        it("should return error, invalid length, >20", (done) => {
            let user = generateUser();
            user.username = "2LMSLmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
            chai.request(server)
                .post(URL)
                .send(user)
                .end((err, res) => {
                    expect(res).have.status(400);
                    expect(res.body).to.have.all.keys(["errors"]);
                    expect(res.body.errors).to.have.key("username");
                    expect(res.body.errors.username.msg).to.be.equal(`username must be at least ${rules.username.length.min} symbols and less than ${rules.username.length.max} symbols`);
                    done();
                });
        });
        it("should return error, invalid length <3", (done) => {
            let user = generateUser();
            user.username = "ab";
            chai.request(server)
                .post(URL)
                .send(user)
                .end((err, res) => {
                    expect(res).have.status(400);
                    expect(res.body).to.have.all.keys(["errors"]);
                    expect(res.body.errors).to.have.key("username");
                    expect(res.body.errors.username.msg).to.be.equal(`username must be at least ${rules.username.length.min} symbols and less than ${rules.username.length.max} symbols`);
                    done();
                });
        });
        it("should return error, username is already used", (done) => {
            let user = generateUser();
            chai.request(server)
                .post(URL)
                .send(user)
                .end(() =>
                    chai.request(server)
                        .post(URL)
                        .send(user)
                        .end((err, res) => {
                            expect(res).have.status(400);
                            expect(res.body).to.have.all.keys(["errors"]);
                            expect(res.body.errors).to.have.key("username");
                            expect(res.body.errors.username.msg).to.be.equal("this username is already in use");
                            done();
                        }));
        });
    });
    describe("send invalid password", () => {
        it("should return error, username is not present", (done) => {
            let user = {username: generateUser().username};
            chai.request(server)
                .post(URL)
                .send(user)
                .end((err, res) => {
                    expect(res).have.status(400);
                    expect(res.body).to.have.all.keys(["errors"]);
                    expect(res.body.errors).to.have.key("password");
                    expect(res.body.errors.password.msg).to.be.equal("password is required");
                    done();
                });
        });
        it("should return error, invalid symbols", (done) => {
            let user = generateUser();
            user.password = " sdsodnosm!nxal";
            chai.request(server)
                .post(URL)
                .send(user)
                .end((err, res) => {
                    expect(res).have.status(400);
                    expect(res.body).to.have.all.keys(["errors"]);
                    expect(res.body.errors).to.have.key("password");
                    expect(res.body.errors.password.msg).to.be.equal("password must contain at least 1 uppercase letter, 1 digit and 1 special symbol (!,#,$,%,&,?)");
                    done();
                });
        });
        it("should return error, invalid length, >16", (done) => {
            let user = generateUser();
            user.password = "2L#MSLmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaddsdadaaaaaaaaaaaa";
            chai.request(server)
                .post(URL)
                .send(user)
                .end((err, res) => {
                    expect(res).have.status(400);
                    expect(res.body).to.have.all.keys(["errors"]);
                    expect(res.body.errors).to.have.key("password");
                    expect(res.body.errors.password.msg).to.be.equal(`password must be at least ${rules.password.length.min} symbols, and less than ${rules.password.length.max}`);
                    done();
                });
        });
        it("should return error, invalid length <8", (done) => {
            let user = generateUser();
            user.password = "ab";
            chai.request(server)
                .post(URL)
                .send(user)
                .end((err, res) => {
                    expect(res).have.status(400);
                    expect(res.body).to.have.all.keys(["errors"]);
                    expect(res.body.errors).to.have.key("password");
                    expect(res.body.errors.password.msg).to.be.equal(`password must be at least ${rules.password.length.min} symbols, and less than ${rules.password.length.max}`);
                    done();
                });
        });
    })
});
