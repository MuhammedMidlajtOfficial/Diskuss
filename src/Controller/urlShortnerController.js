const Url = require('../models/urlShort/urlShortModel');
const shortId = require('shortid');


const getAllUrls = async (req, res) => {
  try {
    const urls = await Url.find();
    res.status(200).json(urls);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching urls' });
  }
  };


const getUrlById = async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);
    res.status(200).json(url);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching url' });
  }
};

const createUrl = async (req, res) => {
    const { originalUrl } = req.body; // Get URL from request body
    const shortCode = shortId.generate(); // Generate a unique ID

    while (true) {
        const urlExists = await Url.findOne({ shortCode }); // Check if the ID already exists in the database
        if (!urlExists) {
            break; // Break the loop if the ID is unique
        }
        shortCode = shortId.generate(); // Generate a new ID if the ID already exists
    }
    console.log("id ", shortCode);

    const shortUrl = `${process.env.SHORT_BASE_URL || 'http://diskuss.in/vcard'}/${shortCode}`; // Create the short URL
    // Create a new URL document
    const newUrl = new Url({ originalUrl, shortCode, shortUrl });
    console.log("newUrl ", newUrl);
    
    try {
        await newUrl.save(); // Save the document to the database
        res.status(201).json(newUrl);// Send back the shortened URL
    } catch (error) {
        console.log("error ", error);
        res.status(500).send('Error saving URL');
    }
};

const redirectToUrl = async (req, res) => {
    const id = req.params.id;
    try {
        const urlEntry = await Url.findOne({ shortCode: id }); // Find the URL by its short ID
        if (urlEntry) {
            res.redirect(urlEntry.originalUrl); // Redirect to the original URL
        } else {
            res.sendStatus(404); // Send 404 if not found
        }
    } catch (error) {
        res.status(500).send('Error retrieving URL');
    }
};
    

module.exports = {
    getAllUrls,
    getUrlById,
    createUrl,
    redirectToUrl
    };


