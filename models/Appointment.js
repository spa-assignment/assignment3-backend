// Appointment model
// Dependencies -----------------------------------------------------
// import mongoose to be able to define the appointment schema
const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    numOfDogs: {
        type: Number
    },
    appointmentOn: {
        type: Date,
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
}, {
    timestamps: true
})

// Create mongoose Model
const appointmentModel = mongoose.model('Appointment', appointmentSchema)

// Export the model
module.exports = appointmentModel