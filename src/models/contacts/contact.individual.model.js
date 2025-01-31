const { required, boolean } = require('joi');
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  contactOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the owner of the contact
  contactOwnerName: {type:String, required:true},
  contacts: [ {
    name: { type: String, required: true },
    companyName: { type: String, required: true },
    designation: { type: String, required: false },
    companyName: { type: String, required: false, default:"" },
    phnNumber: { type: String, required: true },
    email: { type: String,  match: /.+\@.+\..+/ }, // Added regex for email validation
    website: { type: String, required: false}, // Added regex for URL validation
    location: { type: String, required: false },
    businessCategory: { type: String, required: false },
    scheduled: { type: Boolean, default: false },
    scheduledTime: { type: Date },
    notes: { type: String},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the user who created the contact
    cardImage:[{
      front :{ type:String, default: ''},
      back :{ type:String, default: ''},
    }],
    isDiskussUser: { type:Boolean , default:false}
  } ]
}, { timestamps: true });

// module.exports = mongoose.model('ContactIndividual', contactSchema);
module.exports = mongoose.model('Contact', contactSchema);
