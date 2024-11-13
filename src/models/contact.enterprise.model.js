const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  contactOwnerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  contactOwnerType: { 
    type: String, 
    enum: ['EnterpriseUser', 'EnterpriseEmployee'], 
    required: true 
  }, // Specifies the model type dynamically
  contacts: [{
    name: { type: String, required: true },
    designation: { type: String },
    phnNumber: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      match: /.+\@.+\..+/ // Regex for email validation
    },
    website: { 
      type: String, 
      match: /^(https?:\/\/)?([\da-z\.-]+\.[a-z\.]{2,6})([\/\w \.-]*)*\/?$/ 
    }, // Regex for URL validation
    businessCategory: { type: String },
    scheduled: { type: Boolean, default: false },
    scheduledTime: { type: Date },
    notes: { type: String },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      refPath: 'contactOwnerType', // Dynamic reference to either 'EnterpriseUser' or 'EnterpriseEmployee'
      default: null 
    },
    isDiskussUser: { type: Boolean, default: false }
  }]
}, { timestamps: true });

// Set up refPath for dynamic population of contactOwnerId
contactSchema.path('contactOwnerId').options.refPath = 'contactOwnerType';

module.exports = mongoose.model('ContactEnterprise', contactSchema);
