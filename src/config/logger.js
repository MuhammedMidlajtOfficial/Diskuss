const winston = require('winston');
const { combine, timestamp, printf, splat, simple } = winston.format;

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    info.message += `\n${info.stack}`;
  }
  return info;
});

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
});

require('dotenv').config();

const colorizeFormat = process.env.NODE_ENV === 'development' ? winston.format.colorize() : winston.format.uncolorize();


const printfFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    enumerateErrorFormat(),
    splat(),
    timestamp(),
    simple(),
    colorizeFormat,
    printfFormat,
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
    new winston.transports.File({ filename: './src/logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: './src/logs/combined.log' })
  ]
});

logger.stream = {
  write: function(message) {
    logger.info(message);
  },
};

module.exports = logger;