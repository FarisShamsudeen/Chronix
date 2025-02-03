const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'users'
  },
  addresses: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId, 
      default: () => new mongoose.Types.ObjectId() 
    },
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
    },
    isDefault: { 
      type: Boolean,
      required: true
    }
  }]
});

module.exports = mongoose.model('addresses', addressSchema);
