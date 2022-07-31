const mongoose = require("mongoose");

const converationSchema = mongoose.Schema({
    party1: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "User",
    },
    party2: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "User",
    },
    // packets: {
    //     type: Number,
    //     required: true,
    // },
    chats: [
        {
            type: mongoose.Types.ObjectId,
            required: true,
            ref: "Chat",
        },
    ],
});

module.exports = mongoose.model("Conversation", converationSchema);
