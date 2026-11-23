// ============================================================
// MEALMATE SA
// Express Backend Server
// File: src/server.js
// ============================================================

"use strict";

// ============================================================
// 1. IMPORT REQUIRED PACKAGES
// ============================================================

import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import recipesRouter from "./routes/recipes.js";

// ============================================================
// 2. LOAD ENVIRONMENT VARIABLES
// ============================================================

dotenv.config();


// ============================================================
// 3. INITIALIZE EXPRESS
// ============================================================

const app = express();

const PORT = Number(process.env.PORT) || 3000;


// ============================================================
// 4. GET THE CURRENT FILE DIRECTORY
// ============================================================

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

// The public folder is one level above src.
const publicDirectory = path.join(__dirname, "..", "public");


// ============================================================
// 5. BASIC SERVER CONFIGURATION
// ============================================================

// Hide Express technology information.
app.disable("x-powered-by");

// Allow the backend to receive JSON.
app.use(express.json({
    limit: "1mb"
}));

// Allow form-encoded requests.
app.use(express.urlencoded({
    extended: true,
    limit: "1mb"
}));


// ============================================================
// 6. SERVE THE FRONTEND
// ============================================================

// Serve HTML, CSS, JavaScript and images from public/.
app.use(express.static(publicDirectory));
// Recipe API routes
app.use("/api/recipes", recipesRouter);

// ============================================================
// 7. API HEALTH CHECK
// ============================================================

// This endpoint checks whether the backend is running.
app.get("/api/health", function (req, res) {

    res.status(200).json({

        success: true,

        status: "online",

        message: "MealMate SA backend is running.",

        timestamp: new Date().toISOString()

    });

});


// ============================================================
// 8. API INFORMATION ENDPOINT
// ============================================================

app.get("/api", function (req, res) {

    res.status(200).json({

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
// 9. HANDLE UNKNOWN ROUTES
// ============================================================

app.use(function (req, res) {

    if (req.path.startsWith("/api/")) {

        return res.status(404).json({

            success: false,

            error: "API endpoint not found."

        });

    }

    res.status(404).send("Page not found.");

});


// ============================================================
// 10. GLOBAL ERROR HANDLER
// ============================================================

app.use(function (err, req, res, next) {

    console.error("Server error:", err.message);

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = Number(err.status) || 500;

    res.status(statusCode).json({

        success: false,

        error: statusCode >= 500
            ? "An unexpected server error occurred."
            : err.message

    });

});


// ============================================================
// 11. START THE SERVER
// ============================================================

const server = app.listen(PORT, "0.0.0.0", function () {

    console.log("--------------------------------------");

    console.log("MealMate SA backend started!");

    console.log(`Server: http://localhost:${PORT}`);

    console.log(`Frontend: http://localhost:${PORT}`);

    console.log(`API health: http://localhost:${PORT}/api/health`);

    console.log("--------------------------------------");

});


// ============================================================
// 12. HANDLE SERVER STARTUP ERRORS
// ============================================================

server.on("error", function (error) {

    if (error.code === "EADDRINUSE") {

        console.error(
            `Port ${PORT} is already in use.`
        );

    } else {

        console.error("Unable to start the server:", error);

    }

    process.exitCode = 1;

});


// ============================================================
// END OF SERVER.JS
// ============================================================
