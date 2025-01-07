const fs = require('fs').promises;
const path = require('path');

// Function to parse logs into an array of lines
const parseLogs = async () => {
    console.log('Parsing logs...', __dirname);
    const logFilePath = path.join(__dirname, 'combined.log'); // 
    console.log('logFilePath', logFilePath);

    try {
        const data = await fs.readFile(logFilePath, 'utf8'); // Await the readFile
        const logs = data.split('\n').filter(line => line.trim() !== '');
        console.log('logs : ', logs[0]);
        return logs; // Return the logs
    } catch (err) {
        console.log('Error reading log file', err);
        throw err; // Throw error to be caught in the route handler
    }
}

module.exports = {parseLogs};