const fs = require('fs').promises;
const path = require('path');

const getAllLogs = async (req, res) => {
    const logFilePath = path.join(__dirname,'..','..','..', 'combined.log');
    console.log('logFilePath', logFilePath);
    try {
        const data = await fs.readFile(logFilePath, 'utf8');
        const logs = data.split('\n').filter(line => line.trim() !== '');
        return res.status(200).json({logs});
        // return logs;
    }
    catch (err) {
        return res.status(500).json({error: 'Error reading log file'});
    }
};

module.exports = {getAllLogs};