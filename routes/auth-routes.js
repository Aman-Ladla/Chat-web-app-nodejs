const express = require("express");
const { body } = require("express-validator");

const authController = require("../controller/auth-controller");

const router = express.Router();

router.post(
    "/signup",
    [
        body("name").not().isEmpty(),
        body("email").normalizeEmail().isEmail(),
        body("password").isLength({ min: 6 }),
    ],
    authController.signup
);

router.post("/login", authController.login);

router.get("/users/:squery", authController.getUsers);

module.exports = router;
