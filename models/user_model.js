// Importing necessary modules
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

// Defining user schema
const userSchema = new mongoose.Schema({
    // Full name of the user
    fullName: {
        type: String,
        require: true
    },
    // Phone number of the user
    phone: {
        type: String,
        required: true
    },
    // Gender of the user
    gender: {
        type: String,
        required: true
    },
    // Username of the user (unique)
    username: {
        type: String,
        required: true,
        unique: true
    },
    // Email address of the user
    email: {
        type: String,
        require: true
    },
    // Password of the user
    password: {
        type: String,
        require: true
    },
    // Profile image URL of the user (default image if not provided)
    profileImg: {
        type: String,
        default: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Unknown_person.jpg"
    },
    // List of user's followers
    followers: {
        type: Array,
        default: []
    },
    // List of users being followed by the user
    following: {
        type: Array,
        default: []
    },
    // List of posts bookmarked by the user
    bookmarks: [
        {
            type: ObjectId,
            ref: "PostModel"
        }
    ]
}, { timestamps: true });

// Creating User model from the schema
mongoose.model("UserModel", userSchema);
