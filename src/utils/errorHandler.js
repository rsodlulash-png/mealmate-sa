
/**
 * MealMate SA - Error Handling Utilities
 *
 * Provides reusable error classes and helper functions
 * for handling errors throughout the backend.
 */

// Standard application error
export class AppError extends Error {
    constructor(message, statusCode = 500, details = null) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.status = statusCode;
        this.isOperational = true;
        this.details = details;

        Error.captureStackTrace?.(this, this.constructor);
    }
}

// Error for invalid requests
export class BadRequestError extends AppError {
    constructor(message = "The request contains invalid information.", details = null) {
        super(message, 400, details);
    }
}

// Error when a requested resource cannot be found
export class NotFoundError extends AppError {
    constructor(message = "The requested resource was not found.") {
        super(message, 404);
    }
}

// Error when an external API fails
export class ExternalServiceError extends AppError {
    constructor(message = "An external service is currently unavailable.") {
        super(message, 502);
    }
}

// Error when a resource already exists
export class ConflictError extends AppError {
    constructor(message = "This request conflicts with existing data.") {
        super(message, 409);
    }
}

/**
 * Wraps an asynchronous Express route.
 *
 * If the route encounters an error, it forwards
 * that error to Express using next().
 */
export function asyncHandler(handler) {
    return function (req, res, next) {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}

/**
 * Checks whether an error has a valid HTTP status code.
 */
function getStatusCode(error) {
    const statusCode = Number(error?.statusCode ?? error?.status);

    if (Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599) {
        return statusCode;
    }

    return 500;
}

/**
 * Converts different error types into one consistent format.
 */
export function normaliseError(error) {
    const statusCode = getStatusCode(error);

    return {
        statusCode,
        message: error?.message || "An unexpected error occurred.",
        errors: Array.isArray(error?.errors) ? error.errors : null,
        details: error?.details ?? null,
        isOperational: error?.isOperational === true
    };
}

/**
 * Creates a safe JSON response for the frontend.
 *
 * In production, unexpected server errors receive
 * a general message instead of internal error details.
 */
export function buildErrorResponse(error) {
    const normalised = normaliseError(error);
    const isProduction = process.env.NODE_ENV === "production";
    const isServerError = normalised.statusCode >= 500;

    const message =
        isProduction && isServerError
            ? "Something went wrong on our server. Please try again later."
            : normalised.message;

    const response = {
        success: false,
        message: message
    };

    // Include validation errors when available.
    if (normalised.errors) {
        response.errors = normalised.errors;
    }

    // Include additional details outside production.
    if (!isProduction && normalised.details) {
        response.details = normalised.details;
    }

    // Include stack information only during development.
    if (!isProduction && error?.stack) {
        response.stack = error.stack;
    }

    return {
        statusCode: normalised.statusCode,
        body: response
    };
}

/**
 * Identifies errors that were deliberately created
 * by the application.
 */
export function isOperationalError(error) {
    return error?.isOperational === true;
}
