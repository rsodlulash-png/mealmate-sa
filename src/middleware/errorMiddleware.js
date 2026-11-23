import {
    buildErrorResponse,
    NotFoundError
} from "../utils/errorHandler.js";

/**
 * Handles requests to API routes that do not exist.
 */
export function notFoundHandler(req, res, next) {
    const error = new NotFoundError(
        `Route not found: ${req.method} ${req.originalUrl}`
    );

    next(error);
}

/**
 * Central error-handling middleware.
 *
 * Express identifies error middleware through its
 * four parameters: err, req, res, and next.
 */
export function errorMiddleware(err, req, res, next) {
    // If the response has already started, let Express
    // handle the remaining error.
    if (res.headersSent) {
        return next(err);
    }

    const { statusCode, body } = buildErrorResponse(err);

    // Log unexpected server errors for debugging.
    if (statusCode >= 500) {
        console.error("MealMate SA Server Error:", err);
    }

    return res.status(statusCode).json(body);
}
