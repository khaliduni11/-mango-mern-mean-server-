const mongoose = require("mongoose");

mongoose.set("debug", true);
mongoose.Promise = Promise;

mongoose.connect(`${process.env.MongoAPI}`, {
    keepAlive: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
});

module.exports.User = require("./user");
module.exports.Post = require("./post");

