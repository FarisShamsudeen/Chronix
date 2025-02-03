const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    items: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products',
                required: true
            },
            addedOn: {
                type: Date,
                default: Date.now,
                required: true
            }
        }
    ]
});


module.exports = mongoose.model('wishlists', wishlistSchema);

