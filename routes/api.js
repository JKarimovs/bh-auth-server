// Import the dependencies
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 10;

const mongoose = require('mongoose');
const User = require('./../models/user');

// Apply options to mongoose client due to deprecation reasons.
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

// Declare connection string to database
// We set up the access and get the access details in mlab where we set up the database
const db = "mongodb+srv://janis:root@angularauthapp-mnfyw.mongodb.net/authentication?retryWrites=true&w=majority";

// Make connection to database
mongoose.connect(db, err => { 
    if(err){
        console.error("Error: " + err);
    }
    else{
        console.log('Connected to mongoDB');
    }
})

// Token verification middleware
function verifyToken(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(401).send('Unauthorized request');
    }
    // retrieve the token value
    let token = req.headers.authorization.split(' ')[1];
    if(token == 'null') {
        return res.status(401).send('Unauthorized request');
    }
    let payload = jwt.verify(token, 'secretKey');
    if(!payload) {
        return res.status(401).send('Unauthorized request');
    }
    req.userId = payload.subject;
    next();
}

// Next we check if we get a response from the API via GET request
router.get('/', (req, res) => res.send('From API route'));

// Make a call to the API to register a new user
router.post('/register', (req, res) => {
    // Lets extract the user information from request body
    // First lets take the whole request and store it into a variable called userData
    let userData = req.body
    // Next this user data needs to be cast into the user model that mongoose can understand
    // Remember we created a user model in user.js where we export the schema
    let user = new User(userData); // Now we have a user that mongoose understands the structure of

    // Hash Password and save user data to database
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {

        // Hash Password
        bcrypt.hash(user.password, salt, function(err, hash) {
            if(err) {
                console.log(err);
            }
            else {
                user.password = hash;

                // Now we save the user into the database
                user.save((error, registeredUser) => {
                    if(error){
                        console.log(error);
                    }
                    else{
                        // Create payload (object that contains registered user ID)
                        let payload = { subject: registeredUser._id};
                        let token = jwt.sign(payload, 'secretKey');
                        res.status(200).send({token});
                    }
                })
            }
        });
    });
})

// Make a call to the API to login a user
router.post('/login', (req, res) => {

    // We take the whole request and store it into a variable called userData
    let userData = req.body;

    // Now look for the same matching email in the database that was made through the POST request
    // It will then return either an error or the user matching the email
    User.findOne({email: userData.email}, async (error, user) => {
        if(error){
            console.log(error);
        }
        else{
            if(!user){ // Check if we found a user matching the email
                res.status(401).send('Invalid Email');
            }
            try {
                // Check if password correcy by comparing the password in request body with the hashed password.
                // I don't fully understand yet where it gets the hashed password to compare it with, so it must be magic.
                if (await bcrypt.compare(req.body.password, user.password)) {
                    let payload = {subject: user._id};
                    let token = jwt.sign(payload, 'secretKey');
                    res.status(200).send({token});

                    console.log(user.email + " just logged in.");
                }
                else {
                    res.status(401).send('Invalid Password');
                }
            } catch {
                res.status(500).send();
            }
        }
    })
})

// Then we export the router
module.exports = router;