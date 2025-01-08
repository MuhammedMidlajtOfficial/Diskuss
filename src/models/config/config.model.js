const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  config: {
    type: Object,
    required: true
  },
}, { timestamps: true })

module.exports = mongoose.model('config', configSchema);
