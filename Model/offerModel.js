const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['products', 'categories'],
        required: true
    },
    typeId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'type',
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('offers', offerSchema)
