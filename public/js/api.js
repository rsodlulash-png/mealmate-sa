// ============================================================
// MEALMATE SA
// Frontend API Communication
// File: public/js/api.js
// ============================================================

"use strict";

(function () {

    // ========================================================
    // 1. API CONFIGURATION
    // ========================================================

    // All requests go through our own Express backend.
    // External API keys must remain on the backend.

    const API_BASE_URL = "/api";

    // Maximum time to wait for a response.
    const REQUEST_TIMEOUT = 15000;


    // ========================================================
    // 2. CUSTOM API ERROR
    // ========================================================

    class ApiError extends Error {

        constructor(message, status = 0, data = null) {
            super(message);

            this.name = "ApiError";
            this.status = status;
            this.data = data;
        }

    }


    // ========================================================
    // 3. BUILD QUERY PARAMETERS
    // ========================================================

    function buildQuery(parameters = {}) {

        const query = new URLSearchParams();

        Object.entries(parameters).forEach(function ([key, value]) {

            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {
                return;
            }

            if (Array.isArray(value)) {

                value.forEach(function (item) {
                    query.append(key, String(item));
                });

                return;
            }

            query.append(key, String(value));

        });

        const queryString = query.toString();

        return queryString ? `?${queryString}` : "";

    }


    // ========================================================
    // 4. GENERAL API REQUEST FUNCTION
    // ========================================================

    async function request(endpoint, options = {}) {

        const controller = new AbortController();

        const timeoutId = window.setTimeout(function () {
            controller.abort();
        }, REQUEST_TIMEOUT);

        const requestOptions = {
            method: options.method || "GET",

            headers: {
                "Accept": "application/json",
                ...options.headers
            },

            signal: controller.signal,

            credentials: "same-origin"
        };


        // Add JSON data when a request has a body.
        if (options.body !== undefined) {

            requestOptions.headers["Content-Type"] =
                "application/json";

            requestOptions.body = JSON.stringify(options.body);

        }


        try {

            const response = await fetch(
                `${API_BASE_URL}${endpoint}`,
                requestOptions
            );


            // Read the response body.
            const responseText = await response.text();

            let responseData = null;


            // Convert JSON responses into JavaScript objects.
            if (responseText) {

                try {

                    responseData = JSON.parse(responseText);

                } catch (error) {

                    // Preserve non-JSON responses as text.
                    responseData = {
                        message: responseText
                    };

                }

            }


            // Handle unsuccessful HTTP responses.
            if (!response.ok) {

                const errorMessage =
                    responseData?.message ||
                    responseData?.error ||
                    `Request failed with status ${response.status}.`;

                throw new ApiError(
                    errorMessage,
                    response.status,
                    responseData
                );

            }


            return responseData;

        } catch (error) {

            // Handle timeout errors.
            if (error.name === "AbortError") {

                throw new ApiError(
                    "The request timed out. Please try again."
                );

            }


            // Preserve errors returned by the backend.
            if (error instanceof ApiError) {
                throw error;
            }


            // Handle network and connection errors.
            if (
                error instanceof TypeError ||
                error.name === "NetworkError"
            ) {

                throw new ApiError(
                    "Unable to connect to MealMate SA. " +
                    "Please check your connection and try again."
                );

            }


            throw error;

        } finally {

            // Always cancel the timeout.
            window.clearTimeout(timeoutId);

        }

    }


    // ========================================================
    // 5. SEARCH RECIPES
    // ========================================================

    async function searchRecipes(filters = {}) {

        const query = buildQuery({

            search: filters.search,

            category: filters.category,

            diet: filters.diet,

            maxTime: filters.maxTime,

            sort: filters.sort

        });

        return request(`/recipes${query}`);

    }


    // ========================================================
    // 6. GET A SINGLE RECIPE
    // ========================================================

    async function getRecipeById(recipeId) {

        if (
            recipeId === undefined ||
            recipeId === null ||
            String(recipeId).trim() === ""
        ) {
            throw new Error("A valid recipe ID is required.");
        }

        return request(
            `/recipes/${encodeURIComponent(String(recipeId))}`
        );

    }


    // ========================================================
    // 7. GENERATE A WEEKLY MEAL PLAN
    // ========================================================

    async function generateMealPlan(preferences) {

        if (
            !preferences ||
            typeof preferences !== "object"
        ) {
            throw new Error("Valid household preferences are required.");
        }

        return request("/meal-plans", {

            method: "POST",

            body: {
                preferences: preferences
            }

        });

    }


    // ========================================================
    // 8. GET GROCERY PRICE INFORMATION
    // ========================================================

    async function getGroceryPrices(items, retailer = "") {

        if (!Array.isArray(items)) {

            throw new Error(
                "Grocery items must be provided as an array."
            );

        }

        return request("/prices", {

            method: "POST",

            body: {
                items: items,
                retailer: retailer
            }

        });

    }


    // ========================================================
    // 9. GET NUTRITION INFORMATION
    // ========================================================

    async function getNutrition(ingredients) {

        if (!Array.isArray(ingredients)) {

            throw new Error(
                "Ingredients must be provided as an array."
            );

        }

        return request("/nutrition", {

            method: "POST",

            body: {
                ingredients: ingredients
            }

        });

    }


    // ========================================================
    // 10. CHECK BACKEND CONNECTION
    // ========================================================

    async function checkBackendStatus() {

        return request("/health");

    }


    // ========================================================
    // 11. PUBLIC API FUNCTIONS
    // ========================================================

    // Other frontend files will access these functions through:
    // window.MealMateAPI

    window.MealMateAPI = Object.freeze({

        request,

        searchRecipes,

        getRecipeById,

        generateMealPlan,

        getGroceryPrices,

        getNutrition,

        checkBackendStatus,

        ApiError

    });


    console.log("MealMate SA API client initialized.");

})();

// ============================================================
// END OF API.JS
// ============================================================
