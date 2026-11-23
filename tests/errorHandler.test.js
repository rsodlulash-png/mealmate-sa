
// ============================================================
// MEALMATE SA
// Error Handling Tests
// File: tests/errorHandler.test.js
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";

import {
    AppError,
    BadRequestError,
    NotFoundError,
    ExternalServiceError,
    ConflictError,
    asyncHandler,
    normaliseError,
    buildErrorResponse,
    isOperationalError
} from "../src/utils/errorHandler.js";

import {
    notFoundHandler,
    errorMiddleware
} from "../src/middleware/errorMiddleware.js";


// ============================================================
// TEST 1: STANDARD APPLICATION ERROR
// ============================================================

test("creates a standard application error", function () {

    const error = new AppError(
        "Something went wrong.",
        500
    );

    assert.equal(error.message, "Something went wrong.");
    assert.equal(error.name, "AppError");
    assert.equal(error.statusCode, 500);
    assert.equal(error.status, 500);
    assert.equal(error.isOperational, true);

});


// ============================================================
// TEST 2: BAD REQUEST ERROR
// ============================================================

test("creates a bad request error with status 400", function () {

    const error = new BadRequestError("Invalid input.");

    assert.equal(error.name, "BadRequestError");
    assert.equal(error.statusCode, 400);
    assert.equal(error.message, "Invalid input.");

});


// ============================================================
// TEST 3: NOT FOUND ERROR
// ============================================================

test("creates a not found error with status 404", function () {

    const error = new NotFoundError("Recipe not found.");

    assert.equal(error.name, "NotFoundError");
    assert.equal(error.statusCode, 404);
    assert.equal(error.message, "Recipe not found.");

});


// ============================================================
// TEST 4: EXTERNAL SERVICE ERROR
// ============================================================

test("creates an external service error with status 502", function () {

    const error = new ExternalServiceError(
        "Recipe provider unavailable."
    );

    assert.equal(error.name, "ExternalServiceError");
    assert.equal(error.statusCode, 502);

});


// ============================================================
// TEST 5: CONFLICT ERROR
// ============================================================

test("creates a conflict error with status 409", function () {

    const error = new ConflictError(
        "A conflict occurred."
    );

    assert.equal(error.name, "ConflictError");
    assert.equal(error.statusCode, 409);

});


// ============================================================
// TEST 6: NORMALISE AN APPLICATION ERROR
// ============================================================

test("normalises an application error", function () {

    const error = new BadRequestError(
        "Invalid household information.",
        {
            field: "adultCount"
        }
    );

    const result = normaliseError(error);

    assert.equal(result.statusCode, 400);

    assert.equal(
        result.message,
        "Invalid household information."
    );

    assert.deepEqual(result.details, {
        field: "adultCount"
    });

    assert.equal(result.isOperational, true);

});


// ============================================================
// TEST 7: NORMALISE AN UNKNOWN ERROR
// ============================================================

test("assigns status 500 to an unknown error", function () {

    const error = new Error("Unexpected failure.");

    const result = normaliseError(error);

    assert.equal(result.statusCode, 500);

    assert.equal(
        result.message,
        "Unexpected failure."
    );

    assert.equal(result.isOperational, false);

    assert.equal(result.details, null);

    assert.equal(result.errors, null);

});


// ============================================================
// TEST 8: FORWARD ASYNCHRONOUS ERRORS
// ============================================================

test("asyncHandler forwards rejected promises to next", async function () {

    const expectedError = new Error(
        "External operation failed."
    );

    const handler = asyncHandler(async function () {

        throw expectedError;

    });

    const receivedError = await new Promise(function (resolve) {

        handler({}, {}, function (error) {

            resolve(error);

        });

    });

    assert.equal(receivedError, expectedError);

});


// ============================================================
// TEST 9: IDENTIFY OPERATIONAL ERRORS
// ============================================================

test("identifies operational application errors", function () {

    const error = new BadRequestError("Invalid request.");

    assert.equal(
        isOperationalError(error),
        true
    );

});


test("identifies unexpected errors as non-operational", function () {

    const error = new Error("Unexpected error.");

    assert.equal(
        isOperationalError(error),
        false
    );

});


// ============================================================
// TEST 10: BUILD DEVELOPMENT ERROR RESPONSE
// ============================================================

test("includes useful debugging information in development", function () {

    const previousEnvironment = process.env.NODE_ENV;

    process.env.NODE_ENV = "development";

    try {

        const error = new BadRequestError(
            "Invalid request.",
            {
                field: "email"
            }
        );

        const result = buildErrorResponse(error);

        assert.equal(result.statusCode, 400);

        assert.equal(result.body.success, false);

        assert.equal(
            result.body.message,
            "Invalid request."
        );

        assert.deepEqual(
            result.body.details,
            {
                field: "email"
            }
        );

        assert.ok(result.body.stack);

    } finally {

        if (previousEnvironment === undefined) {

            delete process.env.NODE_ENV;

        } else {

            process.env.NODE_ENV = previousEnvironment;

        }

    }

});


// ============================================================
// TEST 11: HIDE INTERNAL ERRORS IN PRODUCTION
// ============================================================

test("hides internal server details in production", function () {

    const previousEnvironment = process.env.NODE_ENV;

    process.env.NODE_ENV = "production";

    try {

        const error = new Error(
            "Database credentials were rejected."
        );

        const result = buildErrorResponse(error);

        assert.equal(result.statusCode, 500);

        assert.equal(result.body.success, false);

        assert.equal(
            result.body.message,
            "Something went wrong on our server. Please try again later."
        );

        assert.equal(
            Object.hasOwn(result.body, "stack"),
            false
        );

        assert.equal(
            Object.hasOwn(result.body, "details"),
            false
        );

    } finally {

        if (previousEnvironment === undefined) {

            delete process.env.NODE_ENV;

        } else {

            process.env.NODE_ENV = previousEnvironment;

        }

    }

});


// ============================================================
// TEST 12: INCLUDE VALIDATION ERRORS
// ============================================================

test("includes validation error details in the response", function () {

    const previousEnvironment = process.env.NODE_ENV;

    process.env.NODE_ENV = "development";

    try {

        const error = new ValidationErrorForTest();

        const result = buildErrorResponse(error);

        assert.equal(result.statusCode, 400);

        assert.deepEqual(
            result.body.errors,
            ["Adult count is invalid."]
        );

    } finally {

        if (previousEnvironment === undefined) {

            delete process.env.NODE_ENV;

        } else {

            process.env.NODE_ENV = previousEnvironment;

        }

    }

});


// Helper used by the validation response test.
class ValidationErrorForTest extends Error {

    constructor() {

        super("Household validation failed.");

        this.status = 400;

        this.errors = [
            "Adult count is invalid."
        ];

    }

}


// ============================================================
// TEST 13: HANDLE UNKNOWN API ROUTES
// ============================================================

test("notFoundHandler forwards a descriptive 404 error", function () {

    let receivedError = null;

    const req = {
        method: "GET",
        originalUrl: "/api/unknown"
    };

    notFoundHandler(
        req,
        {},
        function (error) {

            receivedError = error;

        }
    );

    assert.ok(receivedError instanceof NotFoundError);

    assert.equal(
        receivedError.message,
        "Route not found: GET /api/unknown"
    );

    assert.equal(receivedError.statusCode, 404);

});


// ============================================================
// TEST 14: GLOBAL ERROR MIDDLEWARE
// ============================================================

test("errorMiddleware returns the correct JSON error response", function () {

    const error = new BadRequestError(
        "Invalid request."
    );

    const response = {

        statusCode: null,

        body: null,

        status(code) {

            this.statusCode = code;

            return this;

        },

        json(data) {

            this.body = data;

            return this;

        }

    };

    errorMiddleware(
        error,
        {},
        response,
        function () {}
    );

    assert.equal(response.statusCode, 400);

    assert.equal(response.body.success, false);

    assert.equal(
        response.body.message,
        "Invalid request."
    );

});


// ============================================================
// TEST 15: HANDLE ERRORS AFTER HEADERS ARE SENT
// ============================================================

test("forwards errors when response headers have already been sent", function () {

    const error = new Error("Response already started.");

    let forwardedError = null;

    const response = {
        headersSent: true
    };

    errorMiddleware(
        error,
        {},
        response,
        function (receivedError) {

            forwardedError = receivedError;

        }
    );

    assert.equal(forwardedError, error);

});


// ============================================================
// END OF ERROR HANDLER TESTS
// ============================================================
