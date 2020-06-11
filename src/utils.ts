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

export const respond = (response: ApiResponse, statusCode: number, res: Response) => {
    res.status(statusCode).json(response);
}

export const shuffle = (array: any[]) => {
    let j, x, i;
    for (i = array.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = array[i];
        array[i] = array[j];
        array[j] = x;
    }
    return array;
}

// Exclusive
export const getRandomInt = (max: number) => {
    return Math.floor(Math.random() * Math.floor(max));
}

export const getRandomItem = (array: any[]) => {
    return array[getRandomInt(array.length)];
}
