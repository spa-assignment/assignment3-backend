// Order model
// Dependencies -----------------------------------------------------
// import mongoose to be able to define the order schema
const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    items: [{
        type: new mongoose.Schema({
            product: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product',
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            review: {
                type: new mongoose.Schema({
                    image: {
                        type: String
                    },
                    title: {
                        type: String
                    },
                    comment: {
                        type: String,
                        required: true
                    },
                    stars: {
                        type: Number,
                        required: true
                    },
                }),
                required: false
            }
        }),
        required: false
    }],
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

// Create mongoose Model
const orderModel = mongoose.model('Order', orderSchema)

// Export the model
module.exports = orderModel