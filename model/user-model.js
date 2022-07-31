const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        requried: true,
    },
    conversations: [
        {
            type: mongoose.Types.ObjectId,
            ref: "Conversation",
        },
    ],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
