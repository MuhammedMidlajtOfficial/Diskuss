const shortid = require("shortid");
const UrlShortSchema = require('../models/urlShortener/urlShortSchema');
// const validUrl = require("valid-url");
// const config = require("config");

const shortenUrl = async (req, res) => {
    try {
        const { originalUrl } = req.body;

        // // Check if the URL is valid
        // if (!validUrl.isWebUri(originalUrl)) {
        //     return res.status(400).json({ error: "Invalid URL" });
        // }

        // Check if the URL is already shortened
        const url = await UrlShortSchema.findOne({ originalUrl });

        if (url) {
            return res.status(200).json(url);
        }

        // Generate a unique short code
        const shortCode = shortid.generate();

        // Construct the short URL
        // const shortUrl = `${config.get("baseUrl")}/${shortCode}`;
        const shortUrl = `${process.env.BASE_URL}/${shortCode}`;

        // Create a new URL document
        const newUrl = new UrlShortSchema({
            originalUrl,
            shortUrl,
            shortCode,
            createdAt: new Date(),
        });

        // Save the URL to the database
        await newUrl.save();

        return res.status(201).json(newUrl);
    } catch (error) {
        console.error("Error in shortening URL:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

const getOriginalUrl = async (req, res) => {
    try {
        const { shortCode } = req.params;

        // Find the URL by short code
        const url = await UrlShortSchema.findOne({ shortCode });

        if (!url) {
            return res.status(404).json({ error: "URL not found" });
        }

        return res.redirect(url.originalUrl);
    } catch (error) {
        console.error("Error in getting original URL:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


module.exports = {
    shortenUrl,
    getOriginalUrl,
};