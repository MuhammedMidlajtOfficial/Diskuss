const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    minWithdrawalAmount: { type: Number, default : 2000,required: true },
    registrationReward: { type: Number, default: 50 }, // Reward for registration
    cardCreationReward: { type: Number, default: 50 }, // Reward for card creation
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
}, {timestamp : true});

module.exports = mongoose.model('Settings', settingsSchema);
