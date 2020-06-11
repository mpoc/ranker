import { respond } from "./utils";

export class ErrorHandler extends Error {
    statusCode: number;
    constructor(statusCode, error) {
        super();
        this.statusCode = statusCode;
        this.message = error.message || error;
    }
}

export const handleError = (err, res) => {
    const { statusCode = 500, message } = err;
    respond({
        success: false,
        message: message,
        data: {}
    }, statusCode, res);
};
