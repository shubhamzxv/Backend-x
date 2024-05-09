// Importing necessary modules
const express = require('express');
const router = express.Router();
const multer = require("multer");

// Configuring multer for file upload
const storage = multer.diskStorage({
    // Destination folder for storing uploaded files
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    // Naming the uploaded files
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

// Initializing multer middleware
const upload = multer({
    storage: storage,
    limits: {
        // Limiting file size to 1MB
        fileSize: 1024 * 1024 * 1
    },
    // Validating file type
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return res.status(400).json({ error: "File types allowed are .jpeg, .png, .jpg" });
        }
    }
});

// Route for uploading files
router.post("/uploadFile", upload.single('file'), function (req, res) {
    res.json({ "fileName": req.file.filename });
});

// Function for downloading files
const downloadFile = (req, res) => {
    const fileName = req.params.filename;
    const path = __basedir + "/uploads/";

    res.download(path + fileName, (error) => {
        if (error) {
            res.status(500).send({ meassge: "File cannot be downloaded " + error })
        }
    })
}

// Route for downloading files
router.get("/files/:filename", downloadFile);

// Exporting the router
module.exports = router;
