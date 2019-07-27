const mongoose = require("mongoose");

mongoose.set("debug", true);
mongoose.Promise = Promise;

mongoose.connect("mongodb+srv://khalid:khalid@cluster0-irlfb.mongodb.net/test?retryWrites=true&w=majority", {
    keepAlive: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
});

module.exports.User = require("./user");
module.exports.Post = require("./post");

