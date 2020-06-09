import winston from "winston";
import morgan from 'morgan';

const logFormat = winston.format.printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
});

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        logFormat,
        winston.format.colorize()
    ),
    transports: [
        new winston.transports.Console()
    ]
});

const stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

export const httpLogger = morgan("tiny", { stream });
