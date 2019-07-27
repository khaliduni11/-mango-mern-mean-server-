const jwt = require("jsonwebtoken");
const db = require("../model");

//check if the user is logged in or not 
exports.loginRequired = function (req, res, next) {
    try {
        //take this header 
        const token = req.headers.authorization.split(" ")[1];
        //and decode the header
        jwt.verify(token, process.env.SECRET, function (err, decoded) {
            //if logged in go a head
            if (decoded) {
                next();
            } else {
                //if not tell the user first to log in
                return res.status(401).json({
                    message: "Please log in firt"
                })
            }
        })
    } catch (err) {
        return res.status(401).json({
            message: "Please log in firt"
        })
    }
}


//check if the user belongs the post 
exports.checkPostOwner = function (req, res, next) {
    try {
        //take it's header 
        const token = req.headers.authorization.split(" ")[1];
        //and find the post by it's id
        db.Post.findById(req.params.post_id, function (err, foundPost) {
            //if the found the post 
            if (foundPost) {
                // and then decode token header
                jwt.verify(token, process.env.SECRET, function (err, decoded) {
                    //and compare the id of the owner and the person who logged in
                    if (decoded && decoded.id == foundPost.user) {
                        //if there are match then the allow to modify it
                        return next();
                    } else {
                        //if the are not same, then the user has no permission to do this 
                        next({
                            status: 401,
                            message: "Unauthorized"
                        })
                    }
                })
                //if the user doesn't found the post tell the person the is no long this file
            }else{
                next({
                    status: 404,
                    message: "Not Found"
                })
            }
        })
    } catch (err) {
        next({
            status: 400,
            message: "Not authorized"
        })
    }
}

//only show people who sent/recieved message or who is visiting the chat place
exports.checkOwnerMessage = function(req, res, next){
    //take this token from header
    const token = req.headers.authorization.split(" ")[1];
    //decode it this token 
    jwt.verify(token, process.env.SECRET, function(err, decoded){
        // if matches the id of the user who logged in and id who wants the visit
        if(decoded && decoded.id === req.params.id || decoded.id === req.params.sender_id){
            //and it matches then go and do it
            next();
        }else{
            next({
                //chat are same then go if that  is not happened this person is lier and get that person back
                status: 401,
                message: "Unauthorized"
            })
        }
    })
}

//detect from cracker to access user's chat and allow only the two person who have chatted
//that means the sender and/or can visit the chat only, no one else allowed to access outside of 
//that sender and reciever to access
exports.checkOwnersOfChat = function(req, res, next){
    //take from the header
    const token = req.headers.authorization.split(" ")[1];
    //and decode it 
    jwt.verify(token, process.env.SECRET, function(err, decoded){
        //the user who can check this chat must be only:
            //the person who sent the message
            //or the person who recieved the message
        //no one else is allowed
        if(decoded && decoded.id === req.params.person1 || decoded.id === req.params.person2){
            //if one of the user's id who chat matched the user who logged in then 
            //allow him/her to do it
            next()
        }else{
            //otherwise not authorized
            next({
                status: 401,
                message: "Unauthorized"
            })
        }
    })
}