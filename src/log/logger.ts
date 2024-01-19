// logger.ts
import * as winston from 'winston';
import * as fs from 'fs';

if (!fs.existsSync('./logs')) {
    fs.mkdirSync('logs');
}

export const infoLogger = winston.createLogger({
    level: 'info',
    format: winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level}] ${message}`;
    }),
    transports: [
        new winston.transports.File({ filename: 'logs/info.log' })
    ]
});

export const warningLogger = winston.createLogger({
    level: 'warning',
    format: winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level}] ${message}`;
    }),
    transports: [
        new winston.transports.File({ filename: 'logs/warning.log' })
    ]
});

export const errorLogger = winston.createLogger({
    level: 'error',
    format: winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level}] ${message}`;
    }),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log' })
    ]
});