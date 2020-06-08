export class ErrorHandler extends Error {
    statusCode: number;
    constructor(statusCode, message) {
        super();
        this.statusCode = statusCode;
        this.message = message;
    }
}

export const handleError = (err, res) => {
    const { statusCode, message } = err;
    res.status(statusCode).json({
        error: {
            statusCode,
            message
        }
    });
};
