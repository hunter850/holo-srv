import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
            return cb(null, false);
        }
        cb(null, true);
    },
});

export default upload;
