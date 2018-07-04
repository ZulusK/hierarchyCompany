const JWTStrategy=require("passport-jwt").Strategy;
const UserDriver=require("@db").UserDriver;
const ExtractJwt=require("passport-jwt").ExtractJwt;
const config=require("@config");

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.get(`TOKEN_SALT_ACCESS`),
};

module.exports= new JWTStrategy(opts, async (jwt_payload, next) => {
    const user= await UserDriver.getByToken("access", jwt_payload);
    if (user) {
        next(null, user);
    } else {
        next(null, false);
    }
});