const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true 
    },
    isAdmin: {
        type: Boolean,
        required: true
    },
    status: {
        type: Boolean,
        required: true
    },
    usedCoupons: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'coupons',
        default: []
    }

}, { timestamps: true })

module.exports = mongoose.model('users', userSchema)
