const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    product_name: {
        type: String,
        // required: true
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories',
        // required: true
    },
    product_image: {
        type: [String],
        // required: true
    },
    currentPrice: {
        type: Number,
        // required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        // required: true
    },
    stock: {
        type: Number,
        required: true,
        validate: {
            validator: Number.isInteger,
            message: 'Stock must be an integer'
        },
        min: [0, 'Stock cannot be less than 0']
    },
    specification: {
        dial_colour: {
            type: String,
            // required: true
        },
        function: {
            type: String,
            // required: true
        },
        movement: {
            type: String,
            // required: true
        },
        band: {
            type: String,
            // required: true
        },
        case_material: {
            type: String,
            // required: true
        },
        hand_colour: {
            type: String,
            // required: true
        },
        caliber: {
            type: String,
            // required: true
        },
        dual_size: {
            type: Number,
            // required: true
        }
    }
})

module.exports = mongoose.model('products', productSchema)
