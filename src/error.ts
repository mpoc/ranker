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
    res.status(statusCode).json({
        error: {
            statusCode,
            message
        }
    });
};
