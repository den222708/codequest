import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, status = 200) => {
    return res.status(status).json({
        success: true,
        data,
        error: null,
        timestamp: new Date().toISOString(),
    });
};

export const sendError = (res: Response, status: number, message: string) => {
    return res.status(status).json({
        success: false,
        data: null,
        error: message,
        timestamp: new Date().toISOString(),
    });
};
