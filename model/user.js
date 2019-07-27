const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    verify: {
        type: Boolean,
        default: false
    },
    randomNumbers: {
        type: Number
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
