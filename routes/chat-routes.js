const express = require("express");
const { body, query } = require("express-validator");

const chatController = require("../controller/chat-controller");
const checkAuth = require("../middleware/check-auth");
const fileUpload = require("../middleware/file-upload");

const router = express.Router();

router.use(checkAuth);

router.get("/conversations/:uid", chatController.getConversations);

router.get("/newConversationId", chatController.getNewConversationId);

router.get("/conversation/:cid", chatController.getConversation);

router.get(
    "/conversation/previousChat/:cid",
    query("packetNo").not().isEmpty(),
    chatController.getPreviousConversation
);

router.patch(
    "/conversation/:cid",
    fileUpload.single("image"),
    [
        // body("message").not().isEmpty(),
        body("sender").not().isEmpty(),
        body("party2Id").not().isEmpty(),
    ],
    chatController.updateConversation
);

module.exports = router;
