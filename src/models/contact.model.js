const { required } = require('joi');
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: { type: String, required: false },
  mobile: { type: String, required: true },
  email: { type: String, required: true, match: /.+\@.+\..+/ }, // Added regex for email validation
  website: { type: String, required: false}, // Added regex for URL validation
  businessCategory: { type: String, required: false },
  scheduled: { type: Boolean, default: false },
  scheduledTime: { type: Date },
  notes: { type: String},
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required:false }, // Reference to the user who created the contact
  contactOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the owner of the contact
}, {
  timestamps: true // Automatically manage createdAt and updatedAt fields
});

// Export the model with a more descriptive name
module.exports = mongoose.model('Contact', contactSchema);