const router = require("express").Router();
const {
    body,
    validationResult
} = require("express-validator/check");
const {
    matchedData
} = require("express-validator/filter");
const UserDriver = require("@db").UserDriver;
const config = require("@config");
const rules = config.get("validationRules");
const createError = require('http-errors');
const ObjectId = require("mongoose").Types.ObjectId;
const log = require("@utils").logger(module);
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
            if (await UserDriver.contains({
                username: v
            })) {
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
        return res.status(400).json({
            errors: errors.mapped()
        });
    }
    const args = matchedData(req);
    UserDriver.create(args)
        .then(user => {
            return res.json({
                tokens: user.generateJWT(),
                user: user.publicInfo
            })
        })
        .catch(error => {
            next(error)
        })
});

router.post("/signin", passport.authenticate(["basic"], {
    session: false
}), (req, res) => {
    return res.json({
        tokens: req.user.generateJWT(),
        user: req.user.publicInfo
    })
});

router.get("/access-token", passport.authenticate(["bearer-refresh"], {
    session: false
}), (req, res) => {
    return res.json({
        accessToken: req.user.generateJWT().accessToken
    });
});

router.post("/logout", passport.authenticate(["bearer-access", "basic"], {
    session: false
}), async (req, res) => {
    await req.user.regenerateJWTSalts();
    return res.status(200).send();
});


/**
 * put worker+boss - add worker to boss
 * put worker - remove worker from boss
 * put - error
 */
router.put("/workers",
    // authorize
    passport.authenticate(["bearer-access", "basic"], {session: false}),
    // validate
    [
        body("workerId")
            .exists()
            .withMessage("workerId is required")
            .custom((id) => ObjectId.isValid(id))
            .withMessage("workerId is invalid"),
        body("bossId")
            .custom((id) => !id || ObjectId.isValid(id))
            .withMessage("bossId is invalid"),
    ],
    // check for validation errors
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        } else {
            next();
        }
    },
    // load worker and boss from DB
    async (req, res, next) => {
        req.body.worker = await UserDriver.findById(req.body.workerId);
        if (!req.body.worker) {
            return res.status(404).json({errors: {worker: {message: "worker not found"}}});
        } else if (req.body.worker.isAdmin) {
            // admin cannot have any boss
            next(createError.Forbidden());
        }

        if (req.body.bossId) {
            req.body.boss = await UserDriver.findById(req.body.bossId);
            if (!req.body.boss) {
                return res.status(404).json({errors: {boss: {message: "boss not found"}}});
            }

        }
        next();
    },
    // check access
    async (req, res, next) => {
    console.log(req.user.isAdmin)
        if (!await UserDriver.isBossOf({boss: req.user, worker: req.body.worker})) {
            next(createError.Forbidden());
        } else {
            next();
        }
    },
    //change relations
    async (req, res, next) => {
        try {
            if (req.body.boss) {
                await UserDriver.addWorker({boss: req.body.boss, worker: req.body.worker})
            } else {
                await UserDriver.removeWorkerFromOldBoss(req.body.worker);
                res.status(200).send();
            }
        } catch (e) {
            log.error(e);
            next(createError.BadRequest());
        }
    }
);



router.get("/workers",
    passport.authenticate(["bearer-access", "basic"], {session: false}),
    async (req, res) => {
       if(req.user.isAdmin){
           // return all users
           const allUsers=await UserDriver.getFields({},UserDriver.publicFields);
           return res.json(allUsers.map(x=>x.publicInfo))
       }else if(!req.user.isBoss){
           return res.json([req.user.publicInfo]);
       }else{
           //select all subordinates
           const allUsers=await UserDriver.getSubordinates(req.user);
           return res.json(allUsers);
       }
    }
);

module.exports = router;