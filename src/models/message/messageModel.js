const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },           
  localTime: { type: String },
  isRead: { type: Boolean, default: false },
  isAdmin : { type: Boolean },
  readBy : { type: Array },
  forUserType : { type: String, enum: ['INDIVIDUAL', 'ENTERPRISE', 'EMPLOYEE', 'OTHER'], default: 'OTHER' },
  image : { type: String },
  isDeleted : { type: Boolean, default: false },
});


// // Custom transformation
// messageSchema.set('toJSON', {
//   transform: function (doc, ret) {
//     // Convert the timestamp to a string
//     ret.timestamp = ret.timestamp.toISOString(); // ISO 8601 string format
//     return ret;
//   },
// });

// // Custom transformation
// messageSchema.set('toJSON', {
//   transform: function (doc, ret) {
//     // Convert the timestamp to a string
//     ret.timestamp = ret.timestamp.toISOString(); // ISO 8601 string format
//     return ret;
//   },
// });



module.exports = mongoose.model('Message', messageSchema);
