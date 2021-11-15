// User model
// Dependencies -----------------------------------------------------
// import mongoose to be able to define the user schema
const mongoose = require('mongoose')

// import utils so as to be able to hash password
const Utils = require('./../Utils')

// import mongoose-type-email to be able to use the email datatype for the schema
require('mongoose-type-email')

// Defining the user Schema with required fields
// firstName: string, required
// lastName: string, required
// email: email, required
// password: string, required
// accessLevel: number, required
// bio: string
// avatar:  string
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: mongoose.SchemaTypes.Email,
        required: true,
    },
    address: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    password: {
        type: String,
        required: true,
    },
    accessLevel: {
        type: Number,
        required: true,
    },
    avatar: {
        type: String
    },
    cart: [
        {
            type: new mongoose.Schema({
                product: {
                    type: mongoose.Schema.ObjectId,
                    ref: 'Product',
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                }
            }),
            required: false
        }
    ]
}, {
    timestamps: true
})

// Add a middelware so as to hash the password, when 
// the 'save' method is called
userSchema.pre('save', function(next){
    // Check if password is present and is modified
    if(this.password && this.isModified()){
        // Replace original password with new hashed password
        this.password = Utils.hashPassword(this.password) 
    }

    // continue
    next()
})

// Create mongoose Model
const userModel = mongoose.model('User', userSchema)

// Export the user model
module.exports = userModel