const router = require("express").Router();
const {body, validationResult} = require("express-validator/check");
const {matchedData} = require("express-validator/filter");
const UserDriver = require("@db").UserDriver;
const config = require("@config");
const rules = config.get("validationRules");
// const log=require("@utils").logger(module);
const passport = require("passport");

router.post("/signup", [
    body("username")
        .exists()
        .withMessage("username is required")
        .isLength(rules.username.length)
        .withMessage(`username must be at least ${rules.username.length.min} symbols and less than ${rules.username.length.max} symbols`)
        .isAlphanumeric()
        .withMessage("username must contain only letters and numbers")
        .custom(async v => {
            if (await UserDriver.contains({username: v})) {
                throw new Error("this username is already in use");
            }
        }),
    body("password")
        .exists()
        .withMessage("password is required")
        .isLength(rules.password.length)
        .withMessage(`password must be at least ${rules.password.length.min} symbols, and less than ${rules.password.length.max}`)
        .matches(rules.password.regExp)
        .withMessage("password must contain at least 1 uppercase letter, 1 digit and 1 special symbol (!,#,$,%,&,?)")
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.mapped()});
    }
    const args = matchedData(req);
    UserDriver.create(args)
        .then(user => {
            return res.json({
                tokens: user.generateJWT(),
                user: UserDriver.getPublicFields(user)
            })
        })
        .catch(error => {
            next(error)
        })
});

router.post("/signin", passport.authenticate(["basic"], {session: false}), (req, res) => {
    return res.json({
        tokens: req.user.generateJWT(),
        user: UserDriver.getPublicFields(req.user)
    })
});


router.get("/access-token", passport.authenticate(["bearer-refresh"], {session: false}), (req, res) => {
    return res.json({accessToken: req.user.generateJWT().accessToken});
});

router.post("/logout", passport.authenticate(["bearer-access", "basic"], {session: false}), async (req, res) => {
    await req.user.regenerateJWTSalts();
    return res.status(200).send();
});
module.exports = router;