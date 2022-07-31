const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const authRoutes = require("./routes/auth-routes");
const chatRoutes = require("./routes/chat-routes");
const mongoose = require("mongoose");
const HttpError = require("./model/http-error");
const { mongo_UserName, mongo_Password } = require("./credentials");

const app = express();

app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.use((req, res, next) => {
    throw new HttpError("Could not find this route!", 404);
});

app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            console.log(err);
        });
    }

    if (res.headersSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
    .connect(
        `mongodb+srv://${mongo_UserName}:${mongo_Password}@cluster0.aqfijdb.mongodb.net/?retryWrites=true&w=majority`
    )
    .then(() => {
        const server = app.listen(8080);
        const io = require("./socket").init(server);
        io.on("connection", (socket) => {});
    })
    .catch((err) => console.log(err));
