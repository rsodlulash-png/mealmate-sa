// ============================================================
// MEALMATE SA
// Express Application Configuration
// File: src/app.js
// ============================================================

"use strict";

import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import recipesRouter from "./routes/recipes.js";
import pricesRouter from "./routes/prices.js";
import mealPlansRouter from "./routes/mealPlans.js";
import nutritionRouter from "./routes/nutrition.js";

import {
    notFoundHandler,
    errorMiddleware
} from "./middleware/errorMiddleware.js";


// ============================================================
// 1. LOAD ENVIRONMENT VARIABLES
// ============================================================

dotenv.config();


// ============================================================
// 2. INITIALIZE EXPRESS
// ============================================================

const app = express();


// ============================================================
// 3. GET THE PUBLIC DIRECTORY
// ============================================================

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const publicDirectory = path.join(
    __dirname,
    "..",
    "public"
);


// ============================================================
// 4. BASIC SERVER CONFIGURATION
// ============================================================

app.disable("x-powered-by");

app.use(express.json({
    limit: "1mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "1mb"
}));


// ============================================================
// 5. SERVE FRONTEND FILES
// ============================================================

app.use(express.static(publicDirectory));


// ============================================================
// 6. API HEALTH CHECK
// ============================================================

app.get("/api/health", function (req, res) {

    return res.status(200).json({

        success: true,

        status: "online",

        message: "MealMate SA backend is running.",

        timestamp: new Date().toISOString()

    });

});


// ============================================================
// 7. API INFORMATION
// ============================================================

app.get("/api", function (req, res) {

    return res.status(200).json({

        name: "MealMate SA API",

        version: "1.0.0",

        description:
            "Backend API for the MealMate SA meal-planning application.",

        endpoints: {

            health: "/api/health",

            recipes: "/api/recipes",

            mealPlans: "/api/meal-plans",

            prices: "/api/prices",

            nutrition: "/api/nutrition"

        }

    });

});


// ============================================================
// 8. REGISTER API ROUTES
// ============================================================

app.use("/api/recipes", recipesRouter);

app.use("/api/prices", pricesRouter);

app.use("/api/meal-plans", mealPlansRouter);

app.use("/api/nutrition", nutritionRouter);


// ============================================================
// 9. HANDLE UNKNOWN API ROUTES
// ============================================================

// This must come AFTER all registered API routes.

app.use("/api", notFoundHandler);


// ============================================================
// 10. HANDLE UNKNOWN FRONTEND ROUTES
// ============================================================

app.use(function (req, res) {

    return res.status(404).send("Page not found.");

});


// ============================================================
// 11. GLOBAL ERROR HANDLER
// ============================================================

// Keep this LAST so it receives errors from all routes.

app.use(errorMiddleware);


// ============================================================
// 12. EXPORT EXPRESS APPLICATION
// ============================================================

// Tests can import this application and start it
// on a temporary port without starting server.js.

export default app;


// ============================================================
// END OF APP.JS
// ============================================================
