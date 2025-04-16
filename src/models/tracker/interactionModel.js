
const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
    interactionId: {
        type: String,
    },
    user1Id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    user2Id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    lastContactedAt: {
        type: Date,
        default: Date.now
    },
    lastNotifiedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

interactionSchema.pre('save', function(next) {
    // Convert ObjectIds to strings
    const ids = [this.user1Id.toString(), this.user2Id.toString()];
    // Sort the ids lexicographically
    ids.sort();
    // Join with a hyphen
    this.interactionId = ids.join('-');
    
    next();
});

interactionSchema.index({lastContactedAt:1});
interactionSchema.index({lastNotifiedAt:1});

module.exports = mongoose.model('Interaction', interactionSchema);