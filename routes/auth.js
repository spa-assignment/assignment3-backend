// Auth routes
// Dependencies -----------------------------------------------------
// import Utils to be able to verify password and validate access token
const Utils = require('./../Utils')

// import express so as to have access at the router object to setup the user route
const express = require('express')
const router = express.Router()

// import the user model to interact with the database
const User = require('../models/User')

// import jsonwebtoken to be able to decrypt access token
const jwt = require('jsonwebtoken')

// import path to be able handle file paths
const path = require('path')

// POST - sign in user ----------------------------------------------
// /auth/signin
router.post('/signin', (req, res) => {
    // Validate request (email and password)
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({
            error: {
                type: 'invalid_input',
                message: 'Please provide email and password'
            }
        })
    }

    // Find user in database
    User.findOne({
            email: req.body.email
        })
        .then(user => {
            // Check if user exists
            if (!user) {
                // if user does not exist, send back status code 400
                // with error message
                return res.status(400).json({
                    error: {
                        type: 'not_found',
                        message: "User doesn't exist"
                    }
                })
            }

            // If user exists, verify password
            if (!Utils.verifyPassword(req.body.password, user.password)) {
                // If password is not valid, send back status code 400 
                // with error message
                return res.status(400).json({
                    error: {
                        type: 'invalid_input',
                        message: 'Password / Email incorrect'
                    }
                })
            }

            User.findById(user._id)
                .then(user => {
                    const payload = {
                        _id: user._id,
                        accessLevel: user.accessLevel
                    }

                    // Generate accessToken using the Utils class
                    const accessToken = Utils.generateAccessToken(payload)

                    // strip the password from the user object
                    user.password = undefined

                    // Send back response with accessToken and user object
                    return res.json({
                        accessToken: accessToken,
                        user: user
                    })
                })
                .catch(err => {
                    console.log('Error signing in user', err)
                    // On error, send back 500 status with error message
                    res.status(500).json({
                        error: {
                            type: 'internal',
                            message: 'Error signing in user'
                        }
                    })
                })
        })
        .catch(err => {
            console.log('Error signing in user', err)
            // send back 500 status with error message
            return res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Error signing in user'
                }
            })
        })
})

// GET - validate token ---------------------------------------------
// /auth/validate
router.get('/validate', (req, res) => {

    // Get the value (Bearer TOKEN) of the 'Autorization' header
    const authHeader = req.headers['authorization']
    // use split() to get the token (TOKEN) from the header
    const token = authHeader && authHeader.split(' ')[1]

    // Check if the autorization header is present 
    if (!token) {
        return res.status(401).json({
            error: {
                type: 'token',
                message: 'Unauthorised'
            }
        })
    }

    // Validate the token using jwt.verify()
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, tokenData) => {
        // if not valid = send back 403 status = Forbidden 
        if (err) {
            // Token is invalid
            // send a 401 response
            console.log(err)
            return res.status(401).json({
                error: {
                    type: 'token',
                    message: 'Unauthorised'
                }
            })
        }

        /// Token is valid
        // send back to payload/authData as json
        User.findById(tokenData._id)
        .then(user => {
            // remove password field
            user.password = undefined
            res.json({
                user: user
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Error validating token'
                }
            })
        })
    })
})

// Export the router so as it can be imported (in server.js file)
module.exports = router