// Share Schema
const mongoose = require('mongoose');
const ShareSchema = new mongoose.Schema({
    cardId: String,
    userId: String, // who shared it
    sharedAt: Date,
    isViewed: { type: Boolean, default: false },
});

// View Schema
const ViewSchema = new mongoose.Schema({
    cardId: String,
    userId: String,
    viewedAt: Date,
    isUnique: Boolean,
});

// Visitor Schema
const VisitorSchema = new mongoose.Schema({
    cardId: String,
    visitorId: String, // unique identifier for visitor (e.g., IP, user token)
    firstVisit: Date,
    lastVisit: Date,
});

// Click Schema
const ClickSchema = new mongoose.Schema({
    cardId: String,
    userId: String,
    clickedAt: Date,
    link: String,
});

  // Export the model based on the schema
  module.exports = {
    Share: mongoose.model('Share', ShareSchema),
    View: mongoose.model('View', ViewSchema),
    Visitor: mongoose.model('Visitor', VisitorSchema),
    Click: mongoose.model('Click', ClickSchema),
};