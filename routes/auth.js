const express = require("express");
const router = express.Router();
const db = require("../model");
const bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

//creating verification 
//this is allows user to get a random number to verify his/her account after signup/forget password
function randomNumbers(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}


//this function specifies if user verified to go and if not then tells to go back to his/her gmail 
function verifiedCorrectly(email, res) {
    //read the user's email
    db.User.findOne({ email: email }, function (err, foundUser) {
        //if user verified then allow  to login
        if (foundUser.verify) {
            let token = jwt.sign({
                id: foundUser._id,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName,
                email: foundUser.email,
                password: foundUser.password,
                image: foundUser.image
            }, process.env.SECRET);

            return res.status(200).json({
                foundUser,
                token,
            })
        } else if (!foundUser.verfiy) {
            return res.status(401).json({
                message: "verify your account"
            })
        } else {
            return res.status(400).json({
                message: "you have entered wrong email"
            })
        }
    })
}

//creating transporter of nodemailer
let transporter = nodemailer.createTransport({
    service: "hotmail",
    name: 'hotmail.com',
    auth: {
        user: process.env.EMAIL, // generated ethereal user
        pass: process.env.PASSWORD // generated ethereal password
    }
});

//sign up 
router.post("/signup", function (req, res, next) {
    try {
        //create bcrypt that hashes the password 
        bcrypt.hash(req.body.password, 10, function (err, hashPassword) {
            //if there is something wrong show it in the console 
            if (err) {
                console.log(err);
            } else {
                //if there is no wrong then create user 
                //and the variable user stores the data user from the client and inserts to User database
                const user = {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: hashPassword,
                    image: req.body.image,
                    randomNumbers: randomNumbers(100000, 999999)
                }
                //store data from user variable and it ensures if there is error 
                db.User.create(user, function (err, newUser) {
                    //This error prevents if user chooses the email that has already taken 
                    if (err) {
                        return res.status(400).json({
                            message: "This email has already taken. please try another one"
                        })
                        //if this email hasn't taken already then 
                    } else {
                        //if user successfully created 
                        //then send the user to his/her verification to his/her own email
                        transporter.sendMail({
                            from: process.env.EMAIL, // sender address
                            to: newUser.email, // list of receivers
                            subject: "Verify Your Mango app sign up", // Subject line
                            text: `verify here ${newUser.randomNumbers}`, // plain text body
                            html: `<a href='https://mango-mern-client.herokuapp.com/${newUser._id}/${newUser.randomNumbers}/verify'>Mern Stack<a>`
                        })
                            .then(res => {
                                console.log("sent successfully");
                            })
                            .catch(err => {
                                //delete this email if it is no longer email
                                //or went wrong to get user full account
                                //if we keep the database it will distrub the users who gonna sign up in the future
                                //The database only saves the the real account not fake or fruad account 
                                db.User.findOneAndRemove({ _id: newUser._id }, function (err, deleteUser) {
                                    if (deleteUser) {
                                        console.log("the fruad email successfully removed");
                                    } else {
                                        console.log(err);
                                    }
                                })
                                console.log("nothing sent please check that email", err);
                            })

                        verifiedCorrectly(newUser.email, res);
                    }
                })
            }
        })
    }
    catch (err) {
        console.log(err)
    }
})

//resend verify code if user didn't get yet
router.post("/resend", function (req, res, next) {
    //allow user to re enter his/her email
    db.User.findOne({ email: req.body.email }, function (err, foundUser) {
        if (foundUser) {
            transporter.sendMail({
                from: process.env.EMAIL, // sender address
                to: foundUser.email, // list of receivers
                subject: "Verify Your Mango app sign up", // Subject line
                text: `verify here ${foundUser.randomNumbers}`, // plain text body
                html: `<a href='https://mango-mern-client.herokuapp.com/${foundUser._id}/${foundUser.randomNumbers}/verify'>Mern Stack<a>`
            })
                .then(res => {
                    console.log("sent successfully");
                })
                .catch(err => {
                    console.log("failed to send verify code");
                })
            return res.status(200).json({
                message: "Go To you gmail and verify it"
            })
        } else {
            next({
                status: 400,
                message: "email is invalid"
            })
        }
    })
})

//verify the account 
router.put("/:id/:randomNumbers/verify", function (req, res, next) {
    //find the id from the user who clicked from his/her own gmail and automatically verify it
    db.User.findOneAndUpdate({ $and: [{ randomNumbers: req.params.randomNumbers }, { _id: req.params.id }] }, { $set: { verify: true } }, function (err, verified) {
        if (verified) {
            verifiedCorrectly(verified.email, res);
        } else {
            next({
                status: 400,
                message: "Sorry! not verified"
            })
        }
    })
})



//sign in
router.post("/signin", function (req, res, next) {
    try {
        //first find email to after
        db.User.findOne({
            email: req.body.email
        }, function (err, user) {
            //if there is error display it on the console
            if (err) {
                console.log(err);
                //if there is no error happened and found the email correctly 
            } else if (user) {
                //compare the password that hashed before if it matches the password that user entered
                bcrypt.compare(req.body.password, user.password, function (error, userpassword) {
                    //if error happened display on the console of the application
                    if (error) {
                        console.log(error);
                    } else if (userpassword) {

                        //this checks the user if he/she verified already or if not it will tells 
                        //to do now
                        verifiedCorrectly(user.email, res);
                    } else {
                        //if user enters wrong password, he/she will get this message
                        return res.status(400).json({
                            message: "invalid email/password"
                        })
                    }
                })
            } else {
                //if the user enters the email that is not exist 
                return res.status(400).json({
                    message: "invalid email/password"
                })
            }

        })
    } catch (err) {
        console.log(err)
    }
})


//change password
router.put("/:id/change_password", function (req, res, next) {
    try {
        //first get the user who who logged in
        db.User.findOne({ _id: req.params.id }, function (err, foundUser) {
            //if user found
            if (foundUser) {
                //then compare the password that the user has logged in
                //and the password of he/she wants to change 
                //to ensure that the owner wants to change the password 
                //becuase sometimes accidently someone else can try to change where the user
                //has made log in before and forget to log out 
                //to protect that you need re enter password
                bcrypt.compare(req.body.oldPassword, foundUser.password, function (error, oldPassword) {
                    //if there is error display the console
                    if (error) {
                        console.log(error);
                        //if old password is equal the password that user signed in then 
                    } else if (oldPassword) {
                        //hash the new password
                        bcrypt.hash(req.body.newPassword, 10, function (errhash, hash) {
                            //if there is error display on console
                            if (errhash) {
                                console.log("error happened");
                                //if there is no error
                            } else if (hash) {
                                //Then then found the user is know logged in and then reset passwod
                                db.User.findOneAndUpdate({ _id: req.params.id }, { $set: { password: hash } },
                                    function (errupdatePassword, updatedpassword) {
                                        //if something display on the console
                                        if (errupdatePassword) {
                                            console.log(errupdatePassword);
                                            //if there is no wrong
                                        } else if (updatedpassword) {
                                            // then create jwt token and pass it 
                                            let token = jwt.sign({
                                                id: updatedpassword._id,
                                                firstName: updatedpassword.firstName,
                                                lastName: updatedpassword.lastName,
                                                email: updatedpassword.email,
                                                password: updatedpassword.password,
                                                verify: updatedpassword.verfiy
                                            }, process.env.SECRET);
                                            //return the all the data from the user and token
                                            return res.status(200).json({
                                                message: "successfully changed password"
                                            })
                                        } else {
                                            console.log(errupdatePassword);
                                        }
                                    })
                            } else {
                                console.log(errhash);
                            }
                        })

                    } else {
                        next({
                            status: 401,
                            message: "invalid password"
                        })
                    }
                })
            } else {
                next({
                    status: 404,
                    message: "Not Found"
                })
            }
        })
    } catch (err) {
        next({
            status: 401,
            message: "invalid password"
        })
    }

})


//forget password
router.put("/forget_password", function (req, res, next) {
    //find the email and reset the randomNumbers 
    //to protects crackers it needs to get random numbers 
    //that is not predictable
    db.User.findOneAndUpdate({ email: req.body.email }, { $set: { randomNumbers: randomNumbers(100000, 999999) } }, { new: true }, function (err, foundUser) {
        if (foundUser) {
            //the randomNumber have made above will send to the client's gmail and then 
            //then the client will verify it secretly 
            transporter.sendMail({
                from: process.env.EMAIL, // sender address
                to: foundUser.email, // list of receivers
                subject: "Verify Your Mango app sign up", // Subject line
                // text: `verify here/${randomNumbers}/verify`, // plain text body
                html: `<a href='https://mango-mern-client.herokuapp.com/${foundUser._id}/${foundUser.randomNumbers}/updatePassword'>Mern stack<a> <br>`
            })
                .then(res => {
                    console.log("successfully sent");
                })
                .catch(err => {
                    console.log("something went wrong nothing sent", err);
                })
            return res.status(200).json({
                message: "verify it from your gmail. we have sent you an email"
            })
        } else {
            console.log(err)
            next({
                status: 404,
                message: "invalid email"
            })
        }
    })
})

//to verify it within the gmail 
router.put("/forgot_password/:id/:randomNumbers", function (req, res, next) {
    //first it needs to get the id have sent before as a gmail 
    db.User.findOne({ _id: req.params.id }, function (err, foundUser) {
        //if it is found then compare the random in the database stored 
        //and teh random on the on ipaddress 
        //if there match then allow the user to create anew password
        if (foundUser && foundUser.randomNumbers == req.params.randomNumbers) {
            //hash the password
            bcrypt.hash(req.body.password, 10, function (error, hashed) {
                if (hashed) {
                    //then reset password 
                    db.User.findOneAndUpdate({ email: foundUser.email }, { $set: { password: hashed } }, function (err, newlyPassword) {
                        if (newlyPassword) {
                            verifiedCorrectly(newlyPassword.email, res);
                        }
                    })
                } else {
                    console.log("something went wrong");
                }
            })
        } else {
            next({
                status: 400,
                message: "Not Found this user"
            })
        }
    })
})


module.exports = router;