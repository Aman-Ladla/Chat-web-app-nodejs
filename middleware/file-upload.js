const multer = require("multer");
const uuid = require("uuid").v4;

const MIME_TYPE = {
    "image/png": "png",
    "image/jpg": "jpg",
    "image/jpeg": "jpeg",
};

const fileUpload = multer({
    limits: 10000,
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "uploads/images");
        },
        filename: (req, file, cb) => {
            const ext = MIME_TYPE[file.mimetype];
            cb(null, uuid() + "." + ext);
        },
    }),
    fileFilter: (req, file, cb) => {
        const isValid = !!MIME_TYPE[file.mimetype];
        const error = isValid ? null : "Invalid mime type";
        cb(error, isValid);
    },
});

module.exports = fileUpload;
