// Product model
// Dependencies -----------------------------------------------------
// import mongoose to be able to define the product schema
const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    image: {
        type: String
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
})

// Create mongoose Model
const productModel = mongoose.model('Product', productSchema)

// Export the model
module.exports = productModel