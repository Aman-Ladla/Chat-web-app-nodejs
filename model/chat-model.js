const mongoose = require("mongoose");

const chatSchema = mongoose.Schema(
    {
        messagesCount: {
            type: Number,
            requried: true,
        },
        messages: [
            {
                message: {
                    type: String,
                },
                date: {
                    type: Date,
                    required: true,
                },
                sender: {
                    type: mongoose.Types.ObjectId,
                    required: true,
                },
                image: {
                    type: String,
                },
            },
        ],
    }
    // { _id: false }
);

module.exports = mongoose.model("Chat", chatSchema);
