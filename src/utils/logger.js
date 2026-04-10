const winston = require('winston');
const path = require('path');

const isDetailed = process.env.ENABLE_DETAILED_LOGS === 'true';

const transports = [
  new winston.transports.Console()
];

// Si les logs détaillés sont actifs, on sauvegarde dans des fichiers
if (isDetailed) {
  transports.push(
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/activity.log') 
    })
  );
}

const logger = winston.createLogger({
  level: isDetailed ? 'debug' : (process.env.NODE_ENV === 'production' ? 'warn' : 'info'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`;
    })
  ),
  transports,
});

module.exports = logger;
