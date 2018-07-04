const chai = require("chai");
const expect = chai.expect;
const server = require("@server");
const faker = require("faker");
const UserModel = require("@db").UserDriver.model;
const URL = "/user/access-token";
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


describe("/access-token", () => {
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

    describe("valid refresh token", () => {
        it("should return status 200 and new token", (done) => {
            chai.request(server)
                .get(URL)
                .set("authorization", `Bearer ${TOKEN_REFRESH.token}`)
                .end((err, res) => {
                    expect(res).have.status(200);
                    expect(res.body).to.have.key("accessToken");
                    expect(res.body.accessToken).to.have.all.keys(["token","expiredIn"]);
                    done();
                });
        });
        it("old tokens is not outdated", (done) => {
            chai.request(server)
                .get(URL)
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
    describe("invalid token", () => {
        it("should return status 401", (done) => {
            chai.request(server)
                .get(URL)
                .set("authorization", `Bearer asnkanlnKNXAIOXinxoin`)
                .end((err, res) => {
                    expect(res).have.status(401);
                    done();
                });
        });
        it("old tokens is not outdated", (done) => {
            chai.request(server)
                .get(URL)
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
});
