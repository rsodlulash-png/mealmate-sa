// ============================================================
// MEALMATE SA
// API Integration Tests
// File: tests/api.test.js
// ============================================================

import test, {
    before,
    after
} from "node:test";

import assert from "node:assert/strict";

import app from "../src/app.js";


// ============================================================
// 1. TEST SERVER CONFIGURATION
// ============================================================

let server;
let baseUrl;


// Start a temporary Express server before running tests.
before(async function () {

    server = app.listen(0, "127.0.0.1");

    await new Promise(function (resolve, reject) {

        server.once("listening", resolve);

        server.once("error", reject);

    });

    const address = server.address();

    baseUrl = `http://127.0.0.1:${address.port}`;

});


// Close the temporary server after all tests finish.
after(async function () {

    if (server) {

        await new Promise(function (resolve, reject) {

            server.close(function (error) {

                if (error) {
                    reject(error);
                } else {
                    resolve();
                }

            });

        });

    }

});


// ============================================================
// 2. HEALTH CHECK TESTS
// ============================================================

test("GET /api/health returns successful health information", async function () {

    const response = await fetch(
        `${baseUrl}/api/health`
    );

    const data = await response.json();

    assert.equal(response.status, 200);

    assert.equal(data.success, true);

    assert.equal(data.status, "online");

    assert.equal(
        data.message,
        "MealMate SA backend is running."
    );

    assert.ok(
        !Number.isNaN(Date.parse(data.timestamp))
    );

});


// ============================================================
// 3. API INFORMATION TESTS
// ============================================================

test("GET /api returns API information and endpoints", async function () {

    const response = await fetch(
        `${baseUrl}/api`
    );

    const data = await response.json();

    assert.equal(response.status, 200);

    assert.equal(data.name, "MealMate SA API");

    assert.equal(data.version, "1.0.0");

    assert.equal(
        data.endpoints.health,
        "/api/health"
    );

    assert.equal(
        data.endpoints.recipes,
        "/api/recipes"
    );

    assert.equal(
        data.endpoints.mealPlans,
        "/api/meal-plans"
    );

    assert.equal(
        data.endpoints.prices,
        "/api/prices"
    );

    assert.equal(
        data.endpoints.nutrition,
        "/api/nutrition"
    );

});


// ============================================================
// 4. RECIPE SEARCH VALIDATION TESTS
// ============================================================

test("GET /api/recipes rejects search terms longer than 80 characters", async function () {

    const longSearch = "a".repeat(81);

    const response = await fetch(
        `${baseUrl}/api/recipes?search=${longSearch}`
    );

    const data = await response.json();

    assert.equal(response.status, 400);

    assert.equal(data.success, false);

    assert.match(data.message, /80 characters/);

});


test("GET /api/recipes rejects invalid categories", async function () {

    const response = await fetch(
        `${baseUrl}/api/recipes?category=Chicken123`
    );

    const data = await response.json();

    assert.equal(response.status, 400);

    assert.equal(data.success, false);

    assert.match(data.message, /Invalid recipe category/);

});


// ============================================================
// 5. RECIPE DETAILS VALIDATION TESTS
// ============================================================

test("GET /api/recipes/:id rejects non-numeric recipe IDs", async function () {

    const response = await fetch(
        `${baseUrl}/api/recipes/invalid-id`
    );

    const data = await response.json();

    assert.equal(response.status, 400);

    assert.equal(data.success, false);

    assert.match(data.message, /valid recipe ID/);

});


// ============================================================
// 6. GROCERY PRICE API TESTS
// ============================================================

test("GET /api/prices rejects requests without grocery items", async function () {

    const response = await fetch(
        `${baseUrl}/api/prices`
    );

    const data = await response.json();

    assert.equal(response.status, 400);

    assert.equal(data.success, false);

    assert.match(data.message, /grocery items/);

});


test("GET /api/prices returns unavailable prices without inventing values", async function () {

    const response = await fetch(
        `${baseUrl}/api/prices?items=rice,eggs,milk`
    );

    const data = await response.json();

    assert.equal(response.status, 200);

    assert.equal(data.success, true);

    assert.equal(data.currency, "ZAR");

    assert.equal(data.count, 3);

    assert.equal(data.prices.length, 3);

    data.prices.forEach(function (item) {

        assert.equal(item.available, false);

        assert.equal(item.unitPrice, null);

        assert.equal(item.retailer, null);

        assert.equal(item.source, null);

    });

});


// ============================================================
// 7. MEAL PLAN API TESTS
// ============================================================

test("POST /api/meal-plans/generate rejects requests without a body", async function () {

    const response = await fetch(
        `${baseUrl}/api/meal-plans/generate`,
        {
            method: "POST"
        }
    );

    const data = await response.json();

    assert.equal(response.status, 400);

    assert.equal(data.success, false);

    assert.match(
        data.message,
        /household preferences/
    );

});


// ============================================================
// 8. NUTRITION API TESTS
// ============================================================

test("GET /api/nutrition/:recipeId rejects invalid recipe IDs", async function () {

    const response = await fetch(
        `${baseUrl}/api/nutrition/abc`
    );

    const data = await response.json();

    assert.equal(response.status, 400);

    assert.equal(data.success, false);

    assert.match(data.message, /valid recipe ID/);

});


// ============================================================
// 9. UNKNOWN API ROUTE TESTS
// ============================================================

test("unknown API routes return a JSON 404 response", async function () {

    const response = await fetch(
        `${baseUrl}/api/unknown-endpoint`
    );

    const data = await response.json();

    assert.equal(response.status, 404);

    assert.equal(data.success, false);

    assert.match(
        data.message,
        /Route not found/
    );

});


// ============================================================
// 10. UNKNOWN FRONTEND ROUTE TESTS
// ============================================================

test("unknown frontend routes return a 404 response", async function () {

    const response = await fetch(
        `${baseUrl}/this-page-does-not-exist`
    );

    const data = await response.text();

    assert.equal(response.status, 404);

    assert.match(data, /Page not found/);

});


// ============================================================
// END OF API TESTS
// ============================================================
