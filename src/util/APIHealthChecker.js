const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');

// Configuration
const config = {
    baseUrl: 'http://localhost:3000',
    checkInterval: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
    // Add your routes to test here
    routes: [
        { path: '/api/v1', method: 'GET' },
        { path: '/api/v1/logss', method: 'GET' },
        { path: '/api/v1/', method: 'GET' },
        { path: '/api/v1/analytic', method: 'GET' },
        // Add more routes as needed
    ],
    email: {
        enabled: true,
        from: 'monitoring@yourdomain.com',
        to: 'admin@yourdomain.com',
        smtp: {
            host: 'smtp.yourdomain.com',
            port: 587,
            auth: {
                user: 'your-email@yourdomain.com',
                pass: 'your-password'
            }
        }
    },
    logging: {
        directory: 'src/logs/api-check', // Directory to store log files
        keepDays: 30 // Number of days to keep log files
    }   
};

// Ensure log directory exists
async function initializeLogging() {
    try {
        await fs.mkdir(config.logging.directory, { recursive: true });
        await fs.mkdir(path.join(config.logging.directory, 'errors'), { recursive: true });
        console.log(`Log directory initialized: ${config.logging.directory}`);
        console.log(`Error Log directory initialized: ${config.logging.directory}/errors`);
    } catch (error) {
        console.error('Error creating log directory:', error);
    }
}

// Generate log filename based on current date
function getLogFilename() {
    const date = new Date();
    return path.join(
        config.logging.directory,
        `api-check-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`
        // Example filename: api-check-2021-07-01.log
    );
}

function getErrorLogFilename() {
    const date = new Date();
    return path.join(
        config.logging.directory,
        'errors',
        `api-check-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-error.log`
        // Example filename: api-check-2021-07-01.log
    );
}

// Write log entry to file
async function writeToLog(entry) {
    const filename = getLogFilename();
    const logEntry = `${new Date().toISOString()} - ${JSON.stringify(entry)}\n`;
    
    try {
        await fs.appendFile(filename, logEntry);
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
}

async function writeToErrorLog(entry) {
    const filename = getErrorLogFilename();
    const logEntry = `${new Date().toISOString()} - ${JSON.stringify(entry)}\n`;
    
    try {
        await fs.appendFile(filename, logEntry);
    } catch (error) {
        console.error('Error writing to error log file:', error);
    }
}

// Clean up old log files
async function cleanupOldLogs() {
    try {
        const files = await fs.readdir(config.logging.directory);
        const now = new Date();
        
        for (const file of files) {
            const filePath = path.join(config.logging.directory, file);
            const stats = await fs.stat(filePath);
            const daysOld = (now - stats.mtime) / (1000 * 60 * 60 * 24);
            
            if (daysOld > config.logging.keepDays) {
                await fs.unlink(filePath);
                console.log(`Deleted old log file: ${file}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up old logs:', error);
    }
}

// Email transport setup
const transporter = config.email.enabled ? nodemailer.createTransport(config.email.smtp) : null;

// Function to test a single route
async function testRoute(route) {
    try {
        const startTime = Date.now();
        const response = await axios({
            method: route.method,
            url: `${config.baseUrl}${route.path}`,
            timeout: 5000 // 5 second timeout
        });
        const responseTime = Date.now() - startTime;

        return {
            route: route.path,
            status: response.status,
            success: true,
            responseTime,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            route: route.path,
            status: error.response?.status || 500,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Function to send email alerts
async function sendAlert(failedRoutes) {
    if (!config.email.enabled || !failedRoutes.length) return;

    const emailContent = `
        <h2>API Route Check Alert</h2>
        <p>The following routes are experiencing issues:</p>
        <ul>
            ${failedRoutes.map(route => `
                <li>
                    ${route.route} - Status: ${route.status}
                    <br>Error: ${route.error}
                    <br>Time: ${route.timestamp}
                </li>
            `).join('')}
        </ul>
    `;

    try {
        await transporter.sendMail({
            from: config.email.from,
            to: config.email.to,
            subject: 'API Health Check Alert',
            html: emailContent
        });
        console.log('Alert email sent successfully');
    } catch (error) {
        console.error('Error sending alert email:', error);
    }
}

// Main function to check all routes
// Main function to check all routes
async function checkRoutes() {
    console.log(`\nStarting route check at ${new Date().toISOString()}`);
    
    const results = await Promise.all(config.routes.map(testRoute));
    const failedRoutes = results.filter(result => !result.success);
    
    // Log results to console and file
    for (const result of results) {
        const status = result.success ? '✅' : '❌';
        const logMessage = `${status} ${result.route} - Status: ${result.status}${
            result.success ? ` (${result.responseTime}ms)` : ` Error: ${result.error}`
        }`;
        
        console.log(logMessage);
        await writeToLog(result);
    }

    // Send alerts if there are failures
    if (failedRoutes.length > 0) {
        await writeToErrorLog(failedRoutes);
        await sendAlert(failedRoutes);
    }
}

// Start the monitoring
async function startMonitoring() {
    await initializeLogging();
    console.log('Starting API route monitoring...');
    
    // Schedule log cleanup to run daily
    setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
    
    // Start the route checking
    checkRoutes(); // Initial check
    setInterval(checkRoutes, config.checkInterval); // Periodic checks
}

startMonitoring();
