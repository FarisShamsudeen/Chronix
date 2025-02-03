const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
    state: {
        type: String,
        required: true
    },
    districts: {
        type: [String],
        required: true
    }
});

module.exports = mongoose.model('places', placeSchema);
