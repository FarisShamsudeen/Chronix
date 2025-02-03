const mongoose = require('mongoose')

const returnRequestSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'orders',
        required: true
    },
    returnReason: {
        type: String,
        required: true
    },
    isReadMessage: {
        type: Boolean,
        default: false
    }
},{timestamps: true});

module.exports = mongoose.model('returnRequests', returnRequestSchema)