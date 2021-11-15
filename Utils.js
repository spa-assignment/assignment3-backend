// Utils 
// Dependencies -----------------------------------------------------
// import crypto to be able to hash password
const crypto = require('crypto')

// import jsonwebtoken to be able to generate an access token
const jwt = require('jsonwebtoken')

// import uuidv4 to generate an universally unique identifier
const { v4: uuidv4 } = require('uuid')

// import path to be able handle file paths
const path = require('path')

const sharp = require('sharp')

// import fs to do read/write operations
const fs = require('fs')

/** Utils class. */
class Utils {

    /**
     * Takes a password and hashes it (encrypts).
     * 
     * @param {string} password Password to hash.
     * 
     * @returns The hashed password and salt.
     */
    hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex')
        const hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex')
        return [salt, hash].join('$')
    }

    /**
     * Check a password against the original and return true/false if they verify.
     * 
     * @param {string} password Password to verify.
     * @param {string} original Original password.
     * 
     * @returns  True if the password matches, false otherwise.
     */
    verifyPassword(password, original) {
        const originalHash = original.split('$')[1]
        const salt = original.split('$')[0]
        const hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex')
        return hash === originalHash
    }

    /**
     * Generate an access token with the provided payload
     * 
     * @param {any} payload The payload
     * 
     * @returns The access token
     */
    generateAccessToken(payload) {
        // Generating token using the payload, and ACCESS_TOKEN_SECRET from the .env file
        // which will be valid for 7 days
        return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '7d'})
    }

    /**
     * Handler to authenticate the access token before an API request 
     * 
     * @param {any} req The request
     * @param {any} res The respond
     * @param {any} next Function to call to pass control to the next middleware function
     */
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization']        
        const token = authHeader && authHeader.split(' ')[1]
        if(!token){
            return res.status(401).json({
                error: {
                    type: 'token',
                    message: "Unauthorised"
                }
            })
        } 

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if(err) {
                return res.status(401).json({
                    error: {
                        type: 'token',
                        message: "Unauthorised"
                    }
                })
            }

            req.user = user
            next()
        })
    }

    /**
     * Uplaod a file
     * 
     * @param {any} file The file to upload
     * @param {string} uploadPath The upload path
     * @param {any} callback The callback function to call when the file has been uploaded
     */
    uploadFile(file, uploadPath, callback, dimensions = null) {
        // get file extension (.jpg, .png, etc)
        const fileExt = file.name.split('.').pop()
        // create unique file name
        const uniqueFilename = uuidv4() + '.' + fileExt
        // set upload path (where to store image on server)
        const uploadPathFull = path.join(uploadPath, uniqueFilename)

        if (this.isFileImage(file)) {
            dimensions = dimensions ?? { width: 250, height: 250}

            sharp(file.data)
                .resize(dimensions)
                .toFile(uploadPathFull, (err, info) => {
                    if (err) {
                        console.log(err)
                        return false
                    }

                    if (typeof callback === 'function') {
                        callback(uniqueFilename)
                    }
                })
            
        } else {
            // move image to uploadPath
            file.mv(uploadPathFull, err => {
                if (err) {
                    console.log(err)
                    return false
                }

                if (typeof callback === 'function') {
                    callback(uniqueFilename)
                }
            })
        }
    }

    /**
     * Read json from file synchronously
     * 
     * @param {string} filepath 
     * 
     * @returns The json data
     */
    readJsonFromFileSync(filepath) {
        return JSON.parse(fs.readFileSync(filepath))
    }

    /**
     * Write json to file synchronously
     * 
     * @param {string} filepath 
     * @param {any} json 
     */
    writeJsonToFileSync(filepath, json) {
        fs.writeFileSync(filepath, JSON.stringify(json))
    }

    /**
     * Check if a file is an image
     * 
     * @param {*} file 
     * 
     * @returns True if file is an image
     */
    isFileImage(file) {
        return file && file.mimetype.split('/')[0] === 'image';
    }

    /**
     * Store a file
     * @param {string} fieldName 
     * 
     * @returns 
     */
    storeFile(fieldName) {
        return (req, res, next) => {
            if (req.files && req.files[fieldName]) {
                const file = req.files[fieldName]

                // upload avatar image then update user
                const uploadPath = path.join(__dirname, '..', 'public', 'images')
                
                // get file extension (.jpg, .png, etc)
                const fileExt = file.name.split('.').pop()
                // create unique file name
                const uniqueFilename = uuidv4() + '.' + fileExt
                // set upload path (where to store image on server)
                const uploadPathFull = path.join(uploadPath, uniqueFilename)

                console.log(file)
                // move image to uploadPath
                file.mv(uploadPathFull, err => {
                    if (err) {
                        console.log(err)
                        return false
                    }

                    req.file = file
                    req.file.filename = uniqueFilename
                    next()
                })
            } else {
                req.file = null
                next()
            }
        }
    }
}

// Export an instance of the Utils class 
module.exports = new Utils()