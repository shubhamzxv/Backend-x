const express = require('express');
const router = express.Router();
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const userModel = mongoose.model("UserModel");
const { JWT_SECRET } = require('../config');
const protectedResource = require('../middleware/protectedResource');

router.post("/register", (req, res) => {
    const { fullName, email, password, username, gender, phone } = req.body;
    if (!fullName || !username || !email || !password || !gender || !phone) {
        return res.status(400).json({ error: "One or more mandatory fields are empty" });
    }
    userModel.findOne({ email: email })
        .then((userInDB) => {
            if (userInDB) {
                return res.status(500).json({ error: "User with this email already registerd" });
            }
            bcryptjs.hash(password, 10)
                .then((hashedPassword) => {
                    const user = new userModel({ fullName, email, password: hashedPassword, gender, phone, username });
                    user.save()
                        .then((newUser) => {
                            res.status(201).json({ result: "User Signed up Successfully!" });
                        })
                        .catch((err) => {
                            console.log(err);
                        })
                })
        })
        .catch((err) => {
            console.log(err);
        })
})

router.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (!password || !email) {
        return res.status(400).json({ error: "One or more mandatory fields are empty" });
    }
    userModel.findOne({ email: email })
        .then((userInDB) => {
            if (!userInDB) {
                return res.status(401).json({ error: "Invalid Credentials" });
            }
            bcryptjs.compare(password, userInDB.password)
                .then((didMatch) => {
                    if (didMatch) {
                        const jwtToken = jwt.sign({ _id: userInDB._id }, JWT_SECRET);
                        res.status(200).json({ result: { token: jwtToken, userInDB } });
                    } else {
                        return res.status(401).json({ error: "Invalid Credentials" });
                    }
                }).catch((err) => {
                    console.log(err);
                })
        })
        .catch((err) => {
            console.log(err);
        })
});

router.get("/otherusers", protectedResource, async (req, res) => {
    try {
        const id = req.user._id;
        const otherUsers = await userModel.find({ _id: { $ne: id } }).select("-password");
        if (!otherUsers) {
            return res.status(401).json({
                message: "Currently do not have any users."
            })
        };
        return res.status(200).json({
            otherUsers
        })
    } catch (error) {
        console.log(error);
    }
})

// add bookmark 
router.put("/bookmark", protectedResource, async (req, res) => {
    try {
        const loggedInUserId = req.user.id;
        const tweetId = req.body.postId;
        const user = await userModel.findById(loggedInUserId);
        if (user.bookmarks.includes(tweetId)) {
            // remove
            await userModel.findByIdAndUpdate(loggedInUserId, { $pull: { bookmarks: tweetId } });
            return res.status(200).json({
                message: "Romoved bookmark tweet."
            })
        } else {
            // add
            await userModel.findByIdAndUpdate(loggedInUserId, { $push: { bookmarks: tweetId } });
            return res.status(200).json({
                message: "bookmark tweet."
            })
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// show bookmark post of user
router.get("/allbookmarks", protectedResource, async (req, res) => {
    try {
        const loggedInUserId = req.user.id;
        const tweetId = req.body.postId;
        const user = await userModel.findById(loggedInUserId);
        return res.status(200).json({
            user
        })
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;