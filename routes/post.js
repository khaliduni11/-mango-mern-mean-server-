const express = require("express");
const router = express.Router();
const db = require("../model");
const { loginRequired, checkPostOwner } = require("../middleware/index")

//get all posts 
router.get("/:id", loginRequired, function (req, res, next) {
    db.Post.find().sort({ createdAt: "desc" }).populate("user", { firstName: true, lastName: true, image: true, _id: true }).exec(function (err, foundPost) {
        if (foundPost.length > 0) {
            return res.status(200).json({
                foundPost
            })
        } else {
            //if there is no post show the user this message
            return res.status(404).json({
                message: "Empty"
            })
        }
    })
})


//create a new post 
router.post("/:id/post", loginRequired, function (req, res, next) {
    //create variable that stores data from the user before insert to table
    post = {
        post: req.body.post,
        image: req.body.image,
        user: req.params.id,
    }
    //and then insert all of data you have gathererd from user input and stored to gether in post
    db.Post.create(post, function (err, newlyCreated) {
        //if this data created then past the user and it's inside post
        if (newlyCreated) {
            db.Post.findOne({_id: newlyCreated}).populate("user", { firstName: true, lastName: true, image: true, _id: true }).exec(function(err, foundPost){
                if(foundPost){
                    return res.status(200).json({
                        foundPost
                    })
                }else{
                    return res.status(400).json({
                        message: "something went wrong"
                    })
                }
            })
            //and then return the data you have created
            // return res.status(200).json({
            //     newlyCreated
            // })
        } else {
            next({
                status: 400,
                message: "There is something went wrong. Try again"
            })
        }
    })
})



//update the post 
router.put("/:id/:post_id", checkPostOwner, function (req, res, next) {
    //first create  variable that stores data from user
    post = {
        post: req.body.post,
        image: req.body.image
    }
    //then get the item you need to 
    db.Post.findOneAndUpdate({_id: req.params.post_id}, post, {new: true}, function (err, updatedPost) {
        if (updatedPost) {
            //then return the data you have updated with information
            return res.status(200).json({
                updatedPost,
                message: "Successfully updated"
            })
        } else {
            next({
                status: 404,
                message: "Not Found"
            })
        }
    })
})

//delete post
router.delete("/:id/:post_id", checkPostOwner, function (req, res, next) {
    try {
        //find the post and then delete it
        db.Post.findOneAndRemove({_id: req.params.post_id}, function (err, deletedPost) {
            //if it is deleted then tell the user that this is deleted
            if (deletedPost) {
                return res.status(200).json({
                    message: "successfully deleted"
                })
            } else {
                next({
                    status: 404,
                    message: "Not Found"
                });
            }
        })
    } catch (err) {
        next({
            status: 404,
            message: "Not Found"
        });
    }

})




module.exports = router;