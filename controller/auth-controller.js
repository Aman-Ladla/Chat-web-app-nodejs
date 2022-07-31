const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const HttpError = require("../model/http-error");
const User = require("../model/user-model");

exports.getUsers = async (req, res, next) => {
    const searchQuery = req.params.squery;

    if (searchQuery.length === 0) {
        return res.json({ users: [] });
    }

    let filteredUsers;

    try {
        filteredUsers = await User.find(
            {
                email: { $regex: `^${searchQuery}` },
            },
            "-password"
        ).limit(4);
    } catch (error) {
        const err = new Error(error.message, 500);
        return next(err);
    }

    res.json({ users: filteredUsers });
};

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(
            new HttpError("Invalid inputs, please check your input!", 422)
        );
    }

    const { name, email, password } = req.body;

    let user;

    try {
        user = await User.findOne({ email: email });
    } catch (error) {
        const err = new Error(error.message, 500);
        return next(err);
    }

    if (user) {
        return next(new HttpError("User already exists!", 422));
    }

    let hashedPassword;

    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError(error.message, 500));
    }

    const newUser = new User({
        name: name,
        email: email,
        password: hashedPassword,
        conversation: [],
    });

    try {
        await newUser.save();
    } catch (error) {
        const err = new Error(error.message, 500);
        return next(err);
    }

    let token;

    try {
        token = jwt.sign(
            { userId: newUser._id, email: newUser.email },
            "somesupersupersecretkey"
        );
    } catch (error) {
        console.log(error);
        return next(
            new HttpError("Something went wrong, please try again later!", 500)
        );
    }

    res.status(201).json({
        message: "New User Created!",
        userId: newUser._id,
        name: newUser.name,
        token: token,
    });
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    let user;

    try {
        user = await User.findOne({ email: email });
    } catch (error) {
        const err = new HttpError(error.message, 500);
        return next(err);
    }

    if (!user) {
        return next(new HttpError("User does not exist!", 401));
    }

    let isValidPassword = false;

    try {
        isValidPassword = await bcrypt.compare(password, user.password);
    } catch (error) {
        const err = new HttpError(
            "Something went wrong, please try again later",
            500
        );
        return next(err);
    }

    if (!isValidPassword) {
        return next(new HttpError("Invalid credentials!", 401));
    }

    let token;

    try {
        token = jwt.sign(
            { userId: user._id, email: user.email },
            "somesupersupersecretkey"
        );
    } catch (error) {
        return next(
            new HttpError("Something went wrong, please try again later!", 500)
        );
    }

    res.status(200).json({
        userId: user.id,
        name: user.name,
        token: token,
    });
};
