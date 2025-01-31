const mongoose = require('mongoose');

const urlShortSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true
    },
    shortUrl: {
        type: String,
        required: true
    },
    shortCode: {
        type: String,
        required: true
    },
},
    { timestamps: true },
);


const UrlShort = mongoose.model('UrlShort', urlShortSchema);

module.exports = UrlShort;