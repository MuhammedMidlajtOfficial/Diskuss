const cron = require('node-cron');
const axios = require('axios');
const expressListRoutes = require('express-list-routes');
const fs = require('fs');
const path = require('path');

// Function to check all API routes
const checkApiRoutes = async () => {
    const routes = [
        'http://localhost:3000/api/v1',
        'http://localhost:3000/api/v1/users',
        'http://localhost:3000/api/v1/posts',
        'http://localhost:3000/api/v1/comments',

    ];

    for (const route of routes) {
        axios.get(route)
          .then(function (response) {
            console.log(`Checked ${route}: Status ${response.status}`);

          })
          .catch(function (error) {
            console.error(`Error checking ${route}: ${error.message}`);
});  
}};

// console.log(`Checked ${route}: Status ${response.status}`);
// console.error(`Error checking ${route}: ${error.message}`);
// Schedule the task to run every 2 seconds using setInterval
// setInterval(checkApiRoutes, 2000);
// checkApiRoutes()


// ------------------------------------------------------------
// List all routes
// expressListRoutes(app);


// ------------------------------------------------------------
// Function to list all routes
const listRoutes = () => {
    app._router.stack.forEach((middleware) => {
        if (middleware.route) { // If it's a route
            console.log(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
        }
    });
};

// Call the function to list routes
// listRoutes();

// ------------------------------------------------------------
// Function to parse logs into an array of lines
function parseLogs() {
    console.log('Parsing logs...', __dirname);
    const logFilePath = path.join(__dirname, '..', '..', 'combine.logs'); // 
    console.log('logFilePath', logFilePath);

    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            console.log("data :", data);
            console.log('Error reading log file', err);

            // throw err;

            // return res.status(500).json({ error: 'Error reading log file' });
        }
        const logs =  data.split('\n').filter(line => line.trim() !== '');
        return logs;
    });
}


// // Schedule the job to run every 2 hours
// cron.schedule('0 * * * *', () => {
//     console.log('Running API check...');
//     checkApiRoutes();
// });

// cron.schedule('*/1 * * * *', () => {
//     console.log('running a task every minute');

// });
    
// // Function to run every 2 seconds
// const taskFunction = () => {
//     console.log(`Task executed at: ${new Date().toLocaleTimeString()}`);
// };

// // Schedule the task to run every 2 seconds using setInterval
// setInterval(taskFunction, 2000);

// console.log('Task scheduled to run every 2 seconds.');  

module.exports = {parseLogs};