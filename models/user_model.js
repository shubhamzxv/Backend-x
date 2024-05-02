const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({
    fullName:{
        type: String,
        require: true
    },
    phone: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    profileImg:{
        type:String,
        default: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Unknown_person.jpg"
    },
    followers: {
        type: Array,
        default: []
    },
    following: {
        type: Array,
        default: []
    },
    bookmarks: [
        {
            type: ObjectId,
            ref: "PostModel"
        }
    ]
}, { timestamps: true });

mongoose.model("UserModel",userSchema);