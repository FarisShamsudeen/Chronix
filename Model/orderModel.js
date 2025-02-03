const mongoose = require('mongoose');

const ordersSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    items: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
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
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        required: true
    },
    payment_details: {
        transactionId: String,
        status: String
    },
    shipping_address: {
        flatNo: {
            type: String,
            required: true
        },
        area: {
            type: String,
            required: true
        },
        pincode: {
            type: Number,
            required: true
        },
        townCity: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: Number,
            required: true
        }
    },
    payment_status: {
        type: String,
        default: 'Processing',
        required: true
    },
    delivery_status: {
        type: String,
        default: 'Processing',
        required: true
    },
    couponCode: {
        type: String,
    },
    orderedOn: {
        type: Date,
        default: Date.now,
        required: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('orders', ordersSchema);

