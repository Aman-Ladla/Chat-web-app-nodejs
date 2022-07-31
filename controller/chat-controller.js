const mongoose = require("mongoose");
const io = require("../socket");
const { validationResult } = require("express-validator");

const Conversation = require("../model/conversation-model");
const HttpError = require("../model/http-error");
const Chat = require("../model/chat-model");
const User = require("../model/user-model");

exports.getConversations = async (req, res, next) => {
    const userId = req.params.uid;

    try {
        let user = await User.findById(userId);

        user = await user.populate("conversations");

        const userConversations = user.conversations;

        if (userConversations.length === 0) {
            return res.json({ conversations: [] });
        }

        const conversations = [];

        for (const userConversation of userConversations) {
            if (userConversation["party1"].toString() === userId.toString()) {
                const temp = await userConversation.populate("party2");
                const party2 = temp.party2;

                conversations.push({
                    name: party2.name,
                    time: `${new Date().getHours()}:${new Date().getMinutes()}`,
                    party2Id: party2._id,
                    conversationId: userConversation._id,
                    chatId: userConversation.chats[
                        userConversation.chats.length - 1
                    ],
                });
            } else {
                const temp = await userConversation.populate("party1");
                const party1 = temp.party1;

                conversations.push({
                    name: party1.name,
                    time: `${new Date().getHours()}:${new Date().getMinutes()}`,
                    party2Id: party1._id,
                    conversationId: userConversation._id,
                    chatId: userConversation.chats[
                        userConversation.chats.length - 1
                    ],
                });
            }
        }
        res.json({ conversations: conversations });
    } catch (error) {
        console.log(error);
    }
};

exports.getNewConversationId = (req, res, next) => {
    const id = mongoose.Types.ObjectId();
    res.json({ newId: id });
};

exports.getPreviousConversation = async (req, res, next) => {
    const cid = req.params.cid;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(
            new HttpError("Invalid inputs, please check your input!", 422)
        );
    }

    const packetNo = req.query.packetNo;

    if(!!packetNo){
        return res.status(200);
    }

    try {
        const conversation = await Conversation.findById(cid);

        if (!conversation) {
            return next(new HttpError("Cant find the conversation", 422));
        }

        const chatId = conversation.chats[+packetNo];

        const chat = await Chat.findById(chatId);

        return res.status(200).json({ messages: chat.messages });
    } catch (error) {
        return next(new HttpError(error.message, 500));
    }
};

exports.getConversation = async (req, res, next) => {
    const cid = req.params.cid;

    try {
        const conversation = await Conversation.findById(cid);

        if (!conversation) {
            return res.status(200).json({ messages: [] });
        }

        await conversation.populate("chats");

        if (conversation.chats.length > 1) {
            const len = conversation.chats.length;
            const messages = conversation.chats[len - 2].messages.concat(
                conversation.chats[len - 1].messages
            );
            return res.status(200).json({
                messages: messages,
                startChatChunkNum: len - 2,
            });
        } else {
            return res.status(200).json({
                messages: conversation.chats[0].messages,
                startChatChunkNum: 0,
            });
        }
    } catch (error) {
        return next(new HttpError(error.message, 500));
    }
};

exports.updateConversation = async (req, res, next) => {
    const cid = req.params.cid;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(
            new HttpError("Invalid inputs, please check your input!", 422)
        );
    }

    const sender = req.body.sender;
    const message = req.body.message;
    let image;

    if (!!req.file) {
        image = req.file.path;
    }

    if (!!message && !!image) {
        return next(
            new HttpError("Invalid inputs, please check your input!", 422)
        );
    }

    const newMessageId = mongoose.Types.ObjectId();

    let conversation;

    try {
        conversation = await Conversation.findById(cid);

        if (conversation) {
            try {
                const chatId = await conversation.chats[
                    conversation.chats.length - 1
                ];

                let chat = await Chat.findById(chatId);

                if (chat.messagesCount == 5) {
                    const party2 = req.body.party2Id;

                    const party1Doc = await User.findById(sender);
                    const party2Doc = await User.findById(party2);

                    if (!party1Doc || !party2Doc) {
                        return next(new HttpError("Users not found!", 422));
                    }

                    const chat = new Chat({
                        messagesCount: 1,
                        messages: [
                            {
                                message,
                                image,
                                sender,
                                date: new Date(
                                    new Date().getTime() + 330 * 60 * 1000
                                ),
                                _id: newMessageId,
                            },
                        ],
                        sender: sender,
                    });

                    const session = await mongoose.startSession();
                    session.startTransaction();
                    await chat.save();
                    conversation.chats.push(chat._id);
                    await conversation.save({ session: session });
                    await session.commitTransaction();
                    res.json({
                        messages: chat.messages,
                        chatId: chat._id,
                    });
                } else {
                    chat.messagesCount++;
                    chat.messages.push({
                        message,
                        image,
                        sender,
                        date: new Date(new Date().getTime() + 330 * 60 * 1000),
                        _id: newMessageId,
                    });
                    await chat.save();
                    res.json({ messages: chat.messages });
                }
            } catch (error) {
                return next(new HttpError("Something went wrong!", 500));
            }
        } else {
            const party2 = req.body.party2Id;

            const party1Doc = await User.findById(sender);
            const party2Doc = await User.findById(party2);

            if (!party1Doc || !party2Doc) {
                return next(new HttpError("Users not found!", 422));
            }

            const chat = new Chat({
                messagesCount: 1,
                messages: [
                    {
                        message,
                        image,
                        sender,
                        date: new Date(new Date().getTime() + 330 * 60 * 1000),
                        _id: newMessageId,
                    },
                ],
                sender: sender,
            });

            const session = await mongoose.startSession();
            session.startTransaction();
            party1Doc.conversations.push(cid);
            party2Doc.conversations.push(cid);
            await party1Doc.save({ session: session });
            await party2Doc.save({ session: session });
            await chat.save();
            const newConversation = new Conversation({
                _id: mongoose.Types.ObjectId(cid),
                party1: sender,
                party2: party2,
                chats: [chat._id],
            });
            await newConversation.save({ session: session });
            await session.commitTransaction();

            io.getIO().emit("newConversation" + sender.toString(), {
                action: "create",
            });

            io.getIO().emit("newConversation" + party2.toString(), {
                action: "create",
            });

            res.status(200);
        }
        io.getIO().emit("message" + cid.toString(), {
            action: "create",
            message: {
                message,
                image,
                sender,
                date: new Date(new Date().getTime() + 330 * 60 * 1000),
                _id: newMessageId,
            },
        });
    } catch (error) {
        console.log(error);
    }
};
