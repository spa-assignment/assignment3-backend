// product routes
// Dependencies -----------------------------------------------------
// import express so as to have access at the router object to setup the product route
const express = require('express')
const router = express.Router()

// import Utils to be able to verify API route with access token
const Utils = require('../Utils')

// import the appointment model to interact with the database
const Product = require('./../models/Product')

// import path to be able handle file paths
const path = require('path')

// POST = create new product -------------------------------------------
// /product
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

    if (req.user.accessLevel !== 1) {
        return res.status(401).json({
            error: {
                type: 'authentication',
                message: 'Not authorised'
            }
        })
    }

    Product.findOne({
            title: req.body.title
        })
        .then(product => {
            // Check if user with same email already exists
            if (product) {
                return res.status(400).json({
                    error: {
                        type: 'title_in_use',
                        message: 'Product with similar title already in use'
                    }
                })
            }

            function addProduct(productToAdd) {
                const newProduct = new Product(productToAdd)
                newProduct.save()
                    .then(product => res.status(201).json(product))
                    .catch(err => {
                        console.log('Error creating product detail', err)
                        // On error, send back 500 status with error message
                        res.status(500).json({
                            error: {
                                type: 'internal',
                                message: 'Problem creating product detail'
                            }
                        })
                    })
            }

            if (req.files && req.files.image) {
                let uplaodPath = path.join(__dirname, '..', 'public', 'images')
                Utils.uploadFile(req.files.image, uplaodPath, uniqueFilename => {
                    addProduct({
                        ...req.body,
                        image: uniqueFilename
                    })
                })
            } else {
                addProduct({
                    ...req.body,
                    image: null
                })
            }
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

router.get('/', Utils.authenticateToken, (req, res) => {
    Product.find()
        .then(products => res.json(products))
        .catch(err => {
            console.log('Error getting products detail', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem getting products detail'
                }
            })
        })
})

router.get('/:id', Utils.authenticateToken, (req, res) => {
    Product.findById(req.params.id)
        .then(product => {
            if (!product) {
                res.status(404).json({
                    error: {
                        type: 'not_found',
                        message: 'Product doesn\'t exist'
                    }
                })
            } else {
                res.json(product)
            }
        })
        .catch(err => {
            console.log('Error getting product detail', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem getting product detail'
                }
            })
        })
})

router.put('/:id', Utils.authenticateToken, (req, res) => {

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

    if (req.user.accessLevel !== 1) {
        return res.status(401).json({
            error: {
                type: 'authentication',
                message: 'Not authorised'
            }
        })
    }

    Product.findById(req.params.id)
        .then(product => {
            // Check if user with same email already exists
            if (!product) {
                return res.status(404).json({
                    error: {
                        type: 'not_found',
                        message: 'Product doesn\'t exist'
                    }
                })
            } else {
                Product.findOne({
                        title: req.body.title
                    })
                    .then(product => {
                        // Check if user with same email already exists
                        if (product && product._id.toString() !== req.params.id) {
                            return res.status(404).json({
                                error: {
                                    type: 'title_in_use',
                                    message: 'Product with similar title already in use'
                                }
                            })
                        } else {
                            function updateProduct(updateProduct) {
                                Product.findByIdAndUpdate(req.params.id, updateProduct, {
                                        new: true
                                    })
                                    .then(product => res.json(product))
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
                
                            if (req.files && req.files.image) {
                                let uplaodPath = path.join(__dirname, '..', 'public', 'images')
                                Utils.uploadFile(req.files.image, uplaodPath, uniqueFilename => {
                                    updateProduct({
                                        ...req.body,
                                        image: uniqueFilename
                                    })
                                })
                            } else {
                                updateProduct({
                                    ...req.body,
                                    image: null
                                })
                            }
                        }
                    })
                    .catch(err => {
                        console.log('Error updating product detail', err)
                        // On error, send back 500 status with error message
                        return res.status(500).json({
                            error: {
                                type: 'internal',
                                message: 'Problem updating product detail'
                            }
                        })
                    })
            }

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

router.delete('/:id', Utils.authenticateToken, (req, res) => {
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

    if (req.user.accessLevel !== 1) {
        return res.status(401).json({
            error: {
                type: 'authentication',
                message: 'Not authorised'
            }
        })
    }

    Product.findById(req.params.id)
        .then(product => {
            // Check if user with same email already exists
            if (!product) {
                return res.status(404).json({
                    error: {
                        type: 'not_found',
                        message: 'Product doesn\'t exist'
                    }
                })
            }

            // If user exists, delete the user using the User model
            Product.findOneAndDelete({
                    _id: req.params.id
                })
                .then(Product => {
                    res.json(Product)
                })
                .catch(err => {
                    console.log('error deleting product', err)
                    // send back 500 status with error message
                    res.status(500).json({
                        error: {
                            type: 'internal',
                            message: 'error deleting product'
                        }
                    })
                })
        })
        .catch(err => {
            console.log('Error deleting product', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem deleting product'
                }
            })
        })
})

// Export the router so as it can be imported (in server.js file)
module.exports = router