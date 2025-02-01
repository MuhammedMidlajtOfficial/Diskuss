const mongoose = require("mongoose");

// Define a URL schema
const urlShortSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    shortUrl: { type: String, required: true },
}, { timestamps: true });

// Export the model based on the schema
module.exports = mongoose.model("UrlShort", urlShortSchema);