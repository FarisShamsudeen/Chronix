const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    items: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'products'
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
                min: [1, 'Quantity cannot be less than 1']
            }
        }
    ],
}, { timestamps: true });


module.exports = mongoose.model('carts', cartSchema);

