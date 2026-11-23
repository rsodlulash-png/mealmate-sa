// ============================================================
// MEALMATE SA
// Backend Server Startup
// File: src/server.js
// ============================================================

"use strict";

import app from "./app.js";


// ============================================================
// 1. SERVER CONFIGURATION
// ============================================================

const PORT = Number(process.env.PORT) || 3000;


// ============================================================
// 2. START THE SERVER
// ============================================================

const server = app.listen(
    PORT,
    "0.0.0.0",
    function () {

        console.log("--------------------------------------");

        console.log("MealMate SA backend started!");

        console.log(`Server: http://localhost:${PORT}`);

        console.log(`Frontend: http://localhost:${PORT}`);

        console.log(
            `API health: http://localhost:${PORT}/api/health`
        );

        console.log("--------------------------------------");

    }
);


// ============================================================
// 3. HANDLE SERVER STARTUP ERRORS
// ============================================================

server.on("error", function (error) {

    if (error.code === "EADDRINUSE") {

        console.error(
            `Port ${PORT} is already in use.`
        );

    } else {

        console.error(
            "Unable to start the server:",
            error
        );

    }

    process.exitCode = 1;

});


// ============================================================
// END OF SERVER.JS
// ============================================================
