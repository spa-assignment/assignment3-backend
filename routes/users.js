// User routes
// Dependencies -----------------------------------------------------
// import express so as to have access at the router object to setup the user route
const express = require('express')
const router = express.Router()

// import the user model to interact with the database
const User = require('./../models/User')

// import the appointment model to interact with the database
const Product = require('./../models/Product')

// import Utils to be able to verify API route with access token
const Utils = require('./../Utils')

// import path to be able handle file paths
const path = require('path')

const mongoose = require('mongoose')

router.get('/:id', Utils.authenticateToken, (req, res) => {
    if (req.user._id != req.params.id) {
        return res.status(401).json({
            error: {
                type: 'authentication',
                message: 'Not authorised'
            }
        })
    }

    // Use User model to find One user by id
    User.findById(req.params.id)
        .then(user => {
            // Check if user exist
            if (!user) {
                res.status(404).json({
                    error: {
                        type: 'not_found',
                        message: "User doesn't exist"
                    }
                })
            } else {
                // If user exists, send back user
                res.json(user)
            }
        })
        .catch(err => {
            console.log('Error getting user', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem getting user'
                }
            })
        })
})

// POST = create new user -------------------------------------------
// /user
router.post('/', (req, res) => {
    // check if the body (req.body) is empty
    if (!req.body) {
        return res.status(400).json({
            error: {
                type: 'invalid_input',
                message: 'User content is empty'
            }
        })
    }

    // Try to retrieve user with email provided,
    // so as to avoid duplicate entries
    User.findOne({
            email: req.body.email
        })
        .then(user => {
            // Check if user with same email already exists
            if (user) {
                return res.status(400).json({
                    error: {
                        type: 'email_in_use',
                        message: 'Email already in use'
                    }
                })
            }

            req.body.accessLevel = 2

            // If email does not exist then
            // create new user document using the User model
            const newUser = new User(req.body)

            // Save new user document to the database
            newUser.save()
                .then(user => {
                    // send back 201 status and user object
                    res.status(201).json(user)
                })
                .catch(err => {
                    console.log('Error creating user', err)
                    // On error, send back 500 status with error message
                    res.status(500).json({
                        error: {
                            type: 'internal',
                            message: 'Problem creating user'
                        }
                    })
                })
        })
        .catch(err => {
            console.log('Error creating user', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem creating user'
                }
            })
        })
})

router.put('/:id', Utils.authenticateToken, (req, res) => {
    if (req.user._id != req.params.id) {
        return res.status(401).json({
            error: {
                type: 'invalid_input',
                message: 'User content is empty'
            }
        })
    }

    // check if the req.body is empty
    if (!req.body) {
        return res.status(400).json({
            error: {
                type: 'invalid_input',
                message: 'User content is empty'
            }
        })
    }

    // If body is not empty,
    // function to update user model
    function updateUser(update) {
        // update user document using the User model
        User.findByIdAndUpdate(req.params.id, update, {
                new: true
            })
            .then(user => res.json(user))
            .catch(err => {
                console.log('Error updating user', err)
                // On error, send back 500 status with error message
                res.status(500).json({
                    error: {
                        type: 'internal',
                        message: 'Problem updating user'
                    }
                })
            })
    }

    // if avatar image exists, upload!
    if (req.files && req.files.avatar) {
        // upload avatar image then update user
        let uplaodPath = path.join(__dirname, '..', 'public', 'images')

        let resize = null
        if (req.query.avatarWidth) {
            resize = {
                width: parseInt(req.query.avatarWidth)
            }
        }

        if (req.query.avatarHeight) {
            if (resize) {
                resize.height = parseInt(req.query.avatarHeight)
            } else {
                resize = {
                    height: parseInt(req.query.avatarHeight)
                }
            }
        }

        Utils.uploadFile(req.files.avatar, uplaodPath, uniqueFilename => {
            // update user with all fields including avatar
            updateUser({
                ...req.body,
                avatar: uniqueFilename
            })
        }, resize)
    } else {
        updateUser({
            ...req.body
        })
    }
})

router.get('/:id/cart', Utils.authenticateToken, (req, res) => {
    if (req.user._id !== req.params.id) {
        return res.status(401).json({
            error: {
                type: 'authentication',
                message: 'Not authorised'
            }
        })
    }

    // Use User model to find One user by id
    User.findById(req.params.id)
        .populate('cart.product')
        .then(user => {
            // Check if user exist
            if (!user) {
                res.status(404).json({
                    error: {
                        type: 'not_found',
                        message: "User doesn't exist"
                    }
                })
            } else {
                res.json(user.cart ?? [])
            }
        })
        .catch(err => {
            console.log('Error getting cart', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem getting cart'
                }
            })
        })
})

router.put('/:id/cart', Utils.authenticateToken, (req, res) => {
    if (req.user._id !== req.params.id) {
        return res.status(401).json({
            error: {
                type: 'authentication',
                message: 'Not authorised'
            }
        })
    }

    // check if the req.body is empty
    if (!req.body.productId) {
        return res.status(400).json({
            error: {
                type: 'invalid_input',
                message: 'Product id is empty'
            }
        })
    }

    req.body.quantity = parseInt(req.body.quantity)

    Product.findById(req.body.productId)
        .then(product => {
            if (!product) {
                res.status(404).json({
                    error: {
                        type: 'not_found',
                        message: 'Product doesn\'t exist'
                    }
                })
            } else {
                User.findById(req.params.id)
                    .then(user => {
                        const cartItem = user.cart.find(cartItem => cartItem.product._id.toString() === req.body.productId.toString())

                        if ((!cartItem && product.quantity < req.body.quantity) || (cartItem && product.quantity < req.body.quantity)) {
                            res.status(400).json({
                                error: {
                                    type: 'invalid_input',
                                    message: 'Quantity not sufficiant available'
                                }
                            })
                        } else {
                            Product.findByIdAndUpdate(req.body.productId, {
                                    quantity: product.quantity - req.body.quantity
                                }, {
                                    new: true
                                })
                                .then(product => {
                                    if (cartItem) {
                                        User.updateOne({
                                            _id: req.params.id,
                                            "cart.product": req.body.productId 
                                        }, {
                                            $set: {
                                                "cart.$.quantity":  cartItem.quantity + req.body.quantity
                                            }
                                        })
                                        .then((user) => res.json(user))
                                        .catch(err => {
                                            console.log(err)
                                            res.status(500).json({
                                                error: {
                                                    type: 'internal',
                                                    message: 'Problem getting cart detail'
                                                }
                                            })
                                        })
                                    } else {
                                        User.updateOne({
                                            _id: req.params.id
                                        }, {
                                            $push: {
                                                "cart": {
                                                    product: req.body.productId,
                                                    quantity: req.body.quantity
                                                }
                                            }
                                        })
                                        .then((user) => res.json(user))
                                        .catch(err => {
                                            console.log(err)
                                            res.status(500).json({
                                                error: {
                                                    type: 'internal',
                                                    message: 'Problem getting cart detail'
                                                }
                                            })
                                        })
                                    }
                                })
                                .catch(err => {
                                    console.log('Error updating product detail', err)
                                    // On error, send back 500 status with error message
                                    res.status(500).json({
                                        error: {
                                            type: 'internal',
                                            message: 'Problem updating product detail'
                                        }
                                    })
                                })
                        }
                    })
                    .catch(err => {
                        console.log('Error getting cart', err)
                        // On error, send back 500 status with error message
                        res.status(500).json({
                            error: {
                                type: 'internal',
                                message: 'Problem getting cart'
                            }
                        })
                    })
            }
        })
        .catch(err => {
            console.log('Error getting updating cart', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem getting updating cart'
                }
            })
        })
})

router.delete('/:id/cart/products/:productId', Utils.authenticateToken, (req, res) => {
    if (req.user._id !== req.params.id) {
        return res.status(401).json({
            error: {
                type: 'authentication',
                message: 'Not authorised'
            }
        })
    }

    User.findOneAndUpdate({
            _id: req.user._id
        }, {
            $pull: {
                "cart": {
                    "product": req.params.productId
                }
            }
        })
        .then((user) => {
            Product.findByIdAndUpdate(req.params.productId, {
                $inc: {
                    quantity: user.cart.find(cartItem => cartItem.product._id.toString() === req.params.productId).quantity
                }
            })
            .then(() => res.json(user))
            .catch(err => {
                console.log('Error updating product detail', err)
                // On error, send back 500 status with error message
                res.status(500).json({
                    error: {
                        type: 'internal',
                        message: 'Problem updating product detail'
                    }
                })
            })
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem getting updating cart'
                }
            })
        })
})

// Export the router so as it can be imported (in server.js file)
module.exports = router