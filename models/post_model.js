// Import Mongoose
const mongoose = require("mongoose");
// Destructure ObjectId from Mongoose.Schema.Types
const { ObjectId } = mongoose.Schema.Types;

// Define Post Schema
const postSchema = new mongoose.Schema({
    // Description field
    description: {
        type: String,
        required: true
    },
    // Location field
    location: {
        type: String,
        required: true
    },
    // Likes array field
    likes: [
        {
            type: ObjectId,
            ref: "UserModel"
        }
    ],
    // Comments array field
    comments: [
        {
            // Comment text field
            commentText: String,
            // Commented by field
            commentedBy: { type: ObjectId, ref: "UserModel" }
        }
    ],
    // Image field
    image: {
        type: String,
        required: true
    },
    // Author field
    author: {
        type: ObjectId,
        ref: "UserModel"
    }
}, { timestamps: true });

// Create and export PostModel based on postSchema
mongoose.model("PostModel", postSchema);
