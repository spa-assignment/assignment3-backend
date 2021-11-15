// Appointment routes
// Dependencies -----------------------------------------------------
// import express so as to have access at the router object to setup the appointment route
const express = require('express')
const router = express.Router()

// import Utils to be able to verify API route with access token
const Utils = require('../Utils')

// import the appointment model to interact with the database
const Appointment = require('./../models/Appointment')

// import path to be able handle file paths
const path = require('path')

router.get('/', Utils.authenticateToken, (req, res) => {
    Appointment.find()
        .populate("user")
        .then(appointments => res.json(appointments))
        .catch(err => {
            console.log('Error getting appointment detail', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem getting appointment detail'
                }
            })
        })
})

router.get('/user/:id', Utils.authenticateToken, (req, res) => {
    if (req.user._id !== req.params.id) {
        return res.status(401).json({
            error: {
                type: 'authentication',
                message: 'Not authorised'
            }
        })
    }

    Appointment.find({
            user: req.params.id
        })
        .populate("user")
        .then(appointments => {
            if (!appointments) {
                res.status(404).json({
                    error: {
                        type: 'not_found',
                        message: 'No appointment details available'
                    }
                })
            } else {
                res.json(appointments)
            }
        })
        .catch(err => {
            console.log('Error getting appointment detail', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem getting appointment detail'
                }
            })
        })
})

// POST = create new appointment -------------------------------------------
// /appointment
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

    if (req.body.numOfDogs < 1) {
        return res.status(400).json({
            error: {
                type: 'invalid_input',
                message: 'Num of dogs should be greater than 0'
            }
        })
    }

    req.body.status = 'pending'

    const newAppointment = new Appointment(req.body)
    newAppointment.save()
        .then(appointment => res.status(201).json(appointment))
        .catch(err => {
            console.log('Error creating appointment detail', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem creating appointment detail'
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

    Appointment.findById(req.params.id)
        .then(appointment => {
            if (!appointment) {
                return res.status(404).json({
                    error: {
                        type: 'not_found',
                        message: 'Appointments detail doesn\'t exist'
                    }
                })
            }

            if (['rejected', 'cancelled'].indexOf(appointment.status) !== -1) {
                return res.status(400).json({
                    error: {
                        type: 'invalid_action',
                        message: 'Cannot change status when status is \'Rejected\' or \'Cancelled\''
                    }
                })
            }

            const authorisedStatuses = []

            // check if user has required access level to change appointment status
            if (req.user.accessLevel === 1) {
                switch (appointment.status) {
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

            Appointment.findByIdAndUpdate(req.params.id, {
                    status: req.body.status
                }, {
                    new: true
                })
                .then(appointment => res.json(appointment))
                .catch(err => {
                    console.log('Error updating appointment detail', err)
                    // On error, send back 500 status with error message
                    res.status(500).json({
                        error: {
                            type: 'internal',
                            message: 'Problem updating appointment detail'
                        }
                    })
                })

        })
        .catch(err => {
            console.log('Error getting appointment detail', err)
            // On error, send back 500 status with error message
            res.status(500).json({
                error: {
                    type: 'internal',
                    message: 'Problem updating appointment detail'
                }
            })
        })
})

router.get('/reviews', Utils.authenticateToken, (req, res) => {
    Appointment.find()
        .populate("user")
        .then(appointments => {
            res.json(appointments.filter(appointment => appointment.review))
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

router.get('/reviews/:type', Utils.authenticateToken, (req, res) => {
    Appointment.find({
            type: req.params.type
        })
        .populate("user")
        .then(appointments => {
            res.json(appointments.filter(appointment => appointment.review))
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

router.put('/:id/review', Utils.authenticateToken, (req, res) => {
    if (!req.body) {
        return res.status(400).json({
            error: {
                type: 'invalid_input',
                message: 'Content is empty'
            }
        })
    }

    function updateReview(reviewToUpdate) {
        Appointment.updateOne({
                _id: req.params.id
            }, {
                $set: {
                    "review": reviewToUpdate
                }
            })
            .then((appointment) => res.status(201).json(appointment))
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

router.delete('/:id/review', Utils.authenticateToken, (req, res) => {
    Appointment.findOneAndUpdate({
            _id: req.params.id
        }, {
            "review": null
        })
        .then((appointment) => res.status(201).json(appointment))
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