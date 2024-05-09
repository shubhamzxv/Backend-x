// Importing necessary modules
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { MONGODB_URL, PORT } = require('./config');

// Initializing Express application
const app = express();

// Setting global variable for base directory
global.__basedir = __dirname;

// Connecting to MongoDB database
mongoose.connect(MONGODB_URL);
mongoose.connection.on('connected', () => {
    console.log("DB connected");
});
mongoose.connection.on('error', () => {
    console.log("Error found in DB connection");
});

// Allowing cross-origin requests
app.use(cors());

// Parsing JSON request bodies
app.use(express.json());

// Loading user and post models
require('./models/user_model');
require('./models/post_model');

// Loading user, post, and file routes
app.use(require('./routes/user_route'));
app.use(require('./routes/post_route'));
app.use(require('./routes/file_route'));

// Starting the server
app.listen(PORT, () => {
    console.log(`Server listening at port ${PORT}`);
});
