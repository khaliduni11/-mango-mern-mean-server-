require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const Port = process.env.PORT || 3001;
const Auth = require("./routes/auth");
const Post = require("./routes/post");
const path = require("path");


app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/user/auth", Auth);

app.use("/post", Post);


app.get('*', function (request, response) {
    response.sendFile(path.resolve(__dirname, '../Reactjs/build', 'index.html'));
});

app.use(function (req, res, next) {
    let err = new Error("Not Found");
    err.status = 404;
    next(err);
});

app.use(function (error, request, respone, next) {
    return respone.status(error.status || 500).json({
        message: error.message || "Oops something went wrong"
    })
})



app.listen(Port, function () {
    console.log(`This server ${Port} has been started`);
})