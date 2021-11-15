// order routes
// Dependencies -----------------------------------------------------
// import express so as to have access at the router object to setup the order route
const express = require('express')
const router = express.Router()

// import Utils to be able to verify API route with access token
const Utils = require('../Utils')

// import the order model to interact with the database
const Order = require('./../models/Order')

// import the user model to interact with the database
const User = require('./../models/User')

// import path to be able handle file paths
const path = require('path')

router.get('/', Utils.authenticateToken, (req, res) => {
    if (req.user.accessLevel !== 1) {
        return res.status(401).json({
            error: {
                type: 'authentication',
                message: 'Not authorised'
            }
        })
    }

    Order.find()
        .populate("user")
        .populate("items.product")
        .then(order => res.json(order))
        .catch(err => {
            console.log('Error getting order detail', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem getting order detail'
                }
            })
        })
})

router.get('/:id', Utils.authenticateToken, (req, res) => {
    Order.findById(req.params.id)
        .populate("user")
        .populate("items.product")
        .then(order => {
            if (!order) {
                res.status(404).json({
                    error: {
                        type: 'not_found',
                        message: 'No order details available'
                    }
                })
            } else {
                if (req.user._id.toString() !== order.user._id.toString() && req.user.accessLevel !== 1) {
                    return res.status(401).json({
                        error: {
                            type: 'authentication',
                            message: 'Not authorised'
                        }
                    })
                }

                res.json(order)
            }
        })
        .catch(err => {
            console.log('Error getting order detail', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem getting order detail'
                }
            })
        })
})

router.get('/user/:id', Utils.authenticateToken, (req, res) => {
    if (req.user._id.toString() !== req.params.id) {
        console.log('1')
        return res.status(401).json({
            error: {
                type: 'authentication',
                message: 'Not authorised'
            }
        })
    }

    Order.find({
            user: req.params.id
        })
        .populate("user")
        .populate("items.product")
        .then(orders => {
            if (!orders) {
                res.status(404).json({
                    error: {
                        type: 'not_found',
                        message: 'No order details available'
                    }
                })
            } else {
                res.json(orders)
            }
        })
        .catch(err => {
            console.log('Error getting order detail', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem getting order detail'
                }
            })
        })
})

router.post('/', Utils.authenticateToken, (req, res) => {
    // check if the body (req.body) is empty
    if (!req.body) {
        // if body is empty, send back status code 400
        // with error message
        return res.status(400).json({
            error: {
                type: 'invalid_input',
                message: 'Content is empty'
            }
        })
    }

    req.body.status = 'pending'
    req.body.items = JSON.parse(req.body.items)

    const newOrder = new Order(req.body)
    newOrder.save()
        .then(order => {
            User.findOneAndUpdate({
                    _id: req.body.user
                }, {
                    $set: {
                        "cart": []
                    }
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

            return res.status(201).json(order)
        })
        .catch(err => {
            console.log('Error creating order detail', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem creating order detail'
                }
            })
        })
})

router.put('/:id/status', Utils.authenticateToken, (req, res) => {

    // check if the body (req.body) is empty
    if (!req.body) {
        // if body is empty, send back status code 400
        // with error message
        return res.status(400).json({
            error: {
                type: 'invalid_input',
                message: 'Content is empty'
            }
        })
    }

    Order.findById(req.params.id)
        .populate('user')
        .then(order => {
            if (!order) {
                return res.status(404).json({
                    error: {
                        type: 'not_found',
                        message: 'Order detail doesn\'t exist'
                    }
                })
            }

            if (req.user._id.toString() !== order.user._id.toString() && req.user.accessLevel !== 1) {
                return res.status(401).json({
                    error: {
                        type: 'authentication',
                        message: 'Not authorised'
                    }
                })
            }

            if (['rejected', 'cancelled'].indexOf(order.status) !== -1) {
                return res.status(400).json({
                    error: {
                        type: 'invalid_action',
                        message: 'Cannot change status when status is \'Rejected\' or \'Cancelled\''
                    }
                })
            }

            const authorisedStatuses = []

            // check if user has required access level to change status
            if (req.user.accessLevel === 1) {
                switch (order.status) {
                    case 'pending':
                        authorisedStatuses.push('accepted')
                        authorisedStatuses.push('rejected')
                        authorisedStatuses.push('cancelled')
                        break

                    case 'accepted':
                        authorisedStatuses.push('complete')
                        authorisedStatuses.push('cancelled')
                }
            } else if (req.user.accessLevel === 2) {
                authorisedStatuses.push('cancelled')
            }

            if (authorisedStatuses.indexOf(req.body.status) === -1) {
                return res.status(400).json({
                    error: {
                        type: 'invalid_action',
                        message: `Cannot status to \'${req.body.status}\'`
                    }
                })
            }

            Order.findByIdAndUpdate(req.params.id, {
                    status: req.body.status
                }, {
                    new: true
                })
                .then(order => res.json(order))
                .catch(err => {
                    console.log('Error updating order detail', err)
                    // On error, send back 500 status with error message
                    res.status(500).json({
                        error: {
                            type: 'internal',
                            message: 'Problem updating order detail'
                        }
                    })
                })

        })
        .catch(err => {
            console.log('Error getting order detail', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem updating order detail'
                }
            })
        })
})

router.get('/reviews/:productId', Utils.authenticateToken, (req, res) => {
    Order.find({
            "items.product": req.params.productId
        })
        .populate("user")
        .populate("items.product")
        .then(orders => {
            res.json(orders.map(order => order.items
                .filter(item => item.review)
                .map(item => {
                    let review = null
                    if (item.review) {
                        review = {
                            image: item.review.image,
                            title: item.review.title,
                            comment: item.review.comment,
                            stars: item.review.stars,
                            user: {
                                firstName: order.user.firstName,
                                lastName: order.user.lastName
                            }
                        }
                    }

                    return review
                })).flat(1))
        })
        .catch(err => {
            console.log('Error getting reviews', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem getting reviews'
                }
            })
        })
})

router.put('/:id/products/:productId/review', Utils.authenticateToken, (req, res) => {
    if (!req.body) {
        return res.status(400).json({
            error: {
                type: 'invalid_input',
                message: 'Content is empty'
            }
        })
    }

    function updateReview(reviewToUpdate) {
        Order.findOneAndUpdate({
                _id: req.params.id,
                "items.product": req.params.productId
            }, {
                $set: {
                    "items.$.review": reviewToUpdate
                }
            })
            .then((order) => res.status(201).json(order))
            .catch(err => {
                console.log('Problem adding reviews', err)
                res.status(500).json({
                    error: {
                        type: 'internal',
                        message: 'Problem adding reviews'
                    }
                })
            })
    }

    if (req.files && req.files.image) {
        let uplaodPath = path.join(__dirname, '..', 'public', 'images')
        Utils.uploadFile(req.files.image, uplaodPath, uniqueFilename => {
            updateReview({
                ...req.body,
                image: uniqueFilename
            })
        })
    } else {
        updateReview({
            ...req.body,
            image: null
        })
    }
})

router.delete('/:id/products/:productId/review', Utils.authenticateToken, (req, res) => {
    Order.findOneAndUpdate({
            _id: req.params.id,
            "items.product": req.params.productId
        }, {
            $set: {
                "items.$.review": null
            }
        })
        .then((order) => res.status(201).json(order))
        .catch(err => {
            console.log('Problem updating reviews', err)
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem updating reviews'
                }
            })
        })
})


// Export the router so as it can be imported (in server.js file)
module.exports = router