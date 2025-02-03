const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
    status: { 
        type: Boolean, 
        required: true,
        default: true
    },
    discount: { 
        type: Number,
        required: true 
    }, 
    endDate: { 
        type: Date, 
        required: true 
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    code: { 
        type: String, 
        required: true, 
        unique: true 
    },
},
    {
        timestamps: true
    }
)

module.exports = mongoose.model('coupons', couponSchema)
