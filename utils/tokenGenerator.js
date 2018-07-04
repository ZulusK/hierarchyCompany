const jsonwebtoken = require("jsonwebtoken");
const config = require("@config");

module.exports.generate = (type, payload)=> {
    const kind = type.toUpperCase();
    return jsonwebtoken.sign(
        payload,
        config.get(`TOKEN_SALT_${kind}`),
        {
            algorithm: config.get(`TOKEN_GENERATOR_ALGORITHM`),
            expiresIn: config.get(`TOKEN_LIFE_${kind}`)
        }
    );
};
module.exports.decode = (type, token)=> {
    const kind = type.toUpperCase();
    return jsonwebtoken.verify(
        token,
        config.get(`TOKEN_SALT_${kind}`),
        {
            algorithms: config.get(`TOKEN_GENERATOR_ALGORITHM`)
        }
    );
};