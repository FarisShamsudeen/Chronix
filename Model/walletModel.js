const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    transactions: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId(),
            // required: true
        },
        amount: {
            type: Number,
            // required: true
        },
        type: {
            type: String,
            enum: ['credit', 'debit'],
            // required: true
        },
        description: {
            type: String,
        },
        order_id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'orders'
        },
        date: {
            type: Date,
            default: Date.now
        }
    }]
},
    {
        timestamps: true
    })

module.exports = mongoose.model('wallets', walletSchema)
