import winston from "winston";
import morgan from 'morgan';
import { Response } from "express";
import { OK } from "http-status-codes";

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

export interface ApiResponse {
    success: boolean;
    message: string;
    data: object;
}

export const success = (response: ApiResponse, res: Response) => {
    res.status(OK).json(response);
}