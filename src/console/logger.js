const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log file path
const logFile = path.join(logsDir, `bot-logs-${new Date().toISOString().split('T')[0]}.log`);

/**
 * Write log to file with timestamp
 * @param {string} message - The log message
 * @param {string} level - Log level (INFO, WARN, ERROR, DEBUG)
 */
function writeLog(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    fs.appendFileSync(logFile, logEntry, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

/**
 * Log info level messages
 */
function info(message) {
    writeLog(message, 'INFO');
}

/**
 * Log warning level messages
 */
function warn(message) {
    writeLog(message, 'WARN');
}

/**
 * Log error level messages
 */
function error(message) {
    writeLog(message, 'ERROR');
}

/**
 * Log debug level messages
 */
function debug(message) {
    writeLog(message, 'DEBUG');
}

module.exports = {
    info,
    warn,
    error,
    debug
};
