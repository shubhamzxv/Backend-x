const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const PostModel = mongoose.model("PostModel");
const protectedRoute = require("../middleware/protectedResource");

//all users posts
router.get("/allposts", (req, res) => {
    PostModel.find()
        .populate("author", "_id fullName profileImg username")
        .populate("comments.commentedBy", "_id fullName username")
        .then((dbPosts) => {
            res.status(200).json({ posts: dbPosts })
        })
        .catch((error) => {
            console.log(error);
        })
});

//all posts only from logged in user
router.get("/myallposts", protectedRoute, (req, res) => {
    PostModel.find({ author: req.user._id })
        .populate("author", "_id fullName profileImg")
        .then((dbPosts) => {
            res.status(200).json({ posts: dbPosts })
        })
        .catch((error) => {
            console.log(error);
        })
});

// create post 
router.post("/createpost", protectedRoute, (req, res) => {
    const { description, location, image } = req.body;
    if (!description ) {
        return res.status(400).json({ error: "One or more mandatory fields are empty" });
    }
    req.user.password = undefined;
    const postObj = new PostModel({ description: description, 
        location: location, 
        image: image, 
        author: req.user });
    postObj.save()
        .then((newPost) => {
            res.status(201).json({ post: newPost });
        })
        .catch((error) => {
            console.log(error);
        })
});


router.delete("/deletepost/:postId", protectedRoute, async (req, res) => {
    try {
        const postFound = await PostModel.findOne({ _id: req.params.postId }).populate("author", "_id");
        if (!postFound) {
            return res.status(400).json({ error: "Post does not exist" });
        }
        // Check if the post author is the same as the logged-in user, only then allow deletion
        if (postFound.author._id.toString() === req.user._id.toString()) {
            if (postFound) {
                await PostModel.findByIdAndDelete(req.params.postId);
                return res.status(200).json({ result: "Post deleted successfully" });
            } else {
                console.log(postFound);
                return res.status(500).json({ error: "Unable to delete post" });
            }
        } else {
            return res.status(403).json({ error: "Unauthorized to delete this post" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

//  
router.put("/likeordislike",protectedRoute, async (req, res) => {
    try {
        const loggedInUserId = req.user.id;
        const tweetId = req.body.postId;
        const tweet = await PostModel.findById(tweetId);
        if (tweet.likes.includes(loggedInUserId)) {
            // dislike
            await PostModel.findByIdAndUpdate(tweetId, { $pull: { likes: loggedInUserId } });
            return res.status(200).json({
                message: "disliked tweet."
            })
        } else {
            // like
            await PostModel.findByIdAndUpdate(tweetId, { $push: { likes: loggedInUserId } });
            return res.status(200).json({
                message: "liked tweet."
            })
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});




router.put("/comment", protectedRoute, async (req, res) => {
    try {
        const comment = { commentText: req.body.commentText, commentedBy: req.user._id };
        const result = await PostModel.findByIdAndUpdate(req.body.postId, {
            $push: { comments: comment }
        }, {
            new: true // returns updated record
        }).populate("comments.commentedBy", "_id fullName") // comment owner
          .populate("author", "_id fullName"); // post owner

        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;