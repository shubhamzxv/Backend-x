const express = require('express');
const router = express.Router();
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const userModel = mongoose.model("UserModel");
const { JWT_SECRET } = require('../config');
const protectedResource = require('../middleware/protectedResource');

// Api to register
router.post("/api/register", (req, res) => {
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

// api to login
router.post("/api/login", (req, res) => {
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
                        res.status(200).json({ result: { token: jwtToken, 
                            userInDB:{
                                _id:userInDB._id,
                                fullName: userInDB.fullName,
                                profileImg: userInDB.profileImg
                            }
                        } });
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

// api to get the all other users
router.get("/api/otherusers", protectedResource, async (req, res) => {
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
router.put("/api/bookmark", protectedResource, async (req, res) => {
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
router.get("/api/allbookmarks", protectedResource, async (req, res) => {
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

// Api to get single user
router.get("/api/user/:uid", protectedResource, (req, res) => {
    const userId = req.params.uid;

    userModel.findById(userId)
        .select("-password")
        .then((user) => {
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            res.status(200).json({ user });
        })
        .catch((error) => {
            console.log(error);
            res.status(500).json({ error: "Internal server error" });
        });
});

// Follow user
router.post("/api/follow/:id", protectedResource, async (req, res) => {
    try {
        const loggedInUserId = req.body.id;
        const userId = req.params.id;
        const loggedInUser = await userModel.findById(loggedInUserId);
        const user = await userModel.findById(userId);
        if (!user.followers.includes(loggedInUserId)) {
            await user.updateOne({ $push: { followers: loggedInUserId } });
            await loggedInUser.updateOne({ $push: { following: userId } });
        } else {
            return res.status(400).json({
                message: `User already followed to ${user.name}`
            })
        };
        return res.status(200).json({
            message: `just follow`,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
});

// UnFollow user
router.post("/api/unfollow/:id", protectedResource, async (req, res) => {
    try {
        const loggedInUserId = req.body.id;
        const userId = req.params.id;
        const loggedInUser = await userModel.findById(loggedInUserId);
        const user = await userModel.findById(userId);
        if (loggedInUser.following.includes(userId)) {
            await user.updateOne({ $pull: { followers: loggedInUserId } });
            await loggedInUser.updateOne({ $pull: { following: userId } });
        } else {
            return res.status(400).json({
                message: `User has not followed yet`
            })
        };
        return res.status(200).json({
            message: `just unfollow`,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
});

// Update Profile
router.put("/api/update-profile", protectedResource, async (req, res) => {
    try {
        const { fullName, username, password, image, phone, gender } = req.body;
        const user = await userModel.findById(req.user._id);
        //password
        if (password && password.length < 6) {
            return res.json({ error: "Passsword is required and 6 character long" });
        }
        const hashedPassword = password ? await bcryptjs.hash(password, 10) : undefined;

        const updatedUser = await userModel.findByIdAndUpdate(
            req.user._id,
            {
                fullName: fullName || user.fullName,
                username: username || user.username,
                password: hashedPassword || user.password,
                phone: phone || user.phone,
                profileImg: image || user.profileImg,
                gender: gender || user.gender
            },
            { new: true }
        ).select("-password")
        const token = jwt.sign({ _id: req.user._id }, JWT_SECRET, {
            // token expire time 
            expiresIn: "7d",
        });
        res.status(200).send({
            success: true,
            message: "Profile Updated SUccessfully",
            updatedUser,
            token
        });
    } catch (error) {
        console.log(error);
        res.status(400).send({
            success: false,
            message: "Error While Update profile",
            error,
        });
    }
});

module.exports = router;