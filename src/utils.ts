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

export const shiftValueToRange = (value: number, valueMin: number, valueMax: number, rangeMin: number, rangeMax: number) => {
    // https://math.stackexchange.com/questions/914823/shift-numbers-into-a-different-range
    return rangeMin + ((rangeMax - rangeMin) / (valueMax - valueMin)) * (value - valueMin)
}

export const limitValue = (value: number, min: number, max: number) => {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}
