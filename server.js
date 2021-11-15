// Server
// Dependencies -----------------------------------------------------
// import dotenv to configure and access the environment variables 
// defined in the .env file
require('dotenv').config()

// import mongoose to connect to the MongoDB database
const mongoose = require('mongoose')

// import express to configure the server 
const express = require('express')

// import cors to configure express with it
// cors is used to allow any browser to access the API
const cors = require('cors')

// import express-fileupload to handle file uploads to the backend
const fileUpload = require('express-fileupload')

// configure the port to be used by express 
const port = process.env.PORT || 3000

// Database connection ----------------------------------------------
// Connecting to MongoDB using the MONGO_URI variable from 
// the .env file.
mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    // On successful connection
    .then(() => console.log('db connected!'))
    // On error
    .catch((err) => console.log('db connection failed!', err))

// Express app setup ------------------------------------------------
const app = express()
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))
// configure express with cors
app.use('*', cors())
app.use(fileUpload({
    limits: {
        fileSize: 50 * 1024 * 1024
    }
}))

// Routes -----------------------------------------------------------
// add user route
const usersRoute = require('./routes/users')
app.use('/users', usersRoute)

// add auth route
const authRoute = require('./routes/auth')
app.use('/auth', authRoute)

const appointmentsRoute = require('./routes/appointments')
app.use('/appointments', appointmentsRoute)

const ordersRoute = require('./routes/orders')
app.use('/orders', ordersRoute)

const productsRoute = require('./routes/products')
app.use('/products', productsRoute)

app.get('/', (req, res) => res.json({ 'info': 'Backend API for dog care client' }))

// Run app (listen on port)
app.listen(port, () => console.log('Running app on port ' + port))