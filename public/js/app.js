// ============================================================
// MEALMATE SA
// Shared Application JavaScript
// File: public/js/app.js
// ============================================================

"use strict";

// ============================================================
// 1. MOBILE NAVIGATION
// ============================================================

function initializeNavigation() {
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    // Not every page may contain navigation elements.
    if (!menuToggle || !navLinks) {
        return;
    }

    function openMenu() {
        navLinks.classList.add("open");
        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute("aria-label", "Close navigation menu");
        menuToggle.textContent = "×";
    }

    function closeMenu() {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
        menuToggle.textContent = "☰";
    }

    menuToggle.addEventListener("click", function () {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Close the menu after a navigation link is selected.
    navLinks.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", closeMenu);
    });

    // Close the menu when the user clicks outside it.
    document.addEventListener("click", function (event) {
        const clickedInsideMenu = navLinks.contains(event.target);
        const clickedToggle = menuToggle.contains(event.target);

        if (
            menuToggle.getAttribute("aria-expanded") === "true" &&
            !clickedInsideMenu &&
            !clickedToggle
        ) {
            closeMenu();
        }
    });

    // Allow keyboard users to close the menu with Escape.
    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            menuToggle.getAttribute("aria-expanded") === "true"
        ) {
            closeMenu();
            menuToggle.focus();
        }
    });
}


// ============================================================
// 2. AUTOMATIC FOOTER YEAR
// ============================================================

function initializeFooterYear() {
    const yearElements = document.querySelectorAll("#currentYear");

    const currentYear = new Date().getFullYear();

    yearElements.forEach(function (element) {
        element.textContent = currentYear;
    });
}


// ============================================================
// 3. CURRENCY FORMATTING
// ============================================================

function formatCurrency(amount) {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
        return "R0.00";
    }

    return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numericAmount);
}


// ============================================================
// 4. REUSABLE MESSAGE FUNCTION
// ============================================================

function showMessage(elementOrId, message, type = "success") {
    let element = elementOrId;

    // Allow us to pass either an HTML element or its ID.
    if (typeof elementOrId === "string") {
        element = document.getElementById(elementOrId);
    }

    if (!element) {
        console.warn("Message element was not found:", elementOrId);
        return;
    }

    element.textContent = message;

    element.classList.remove(
        "hidden",
        "success-message",
        "error-message"
    );

    if (type === "error") {
        element.classList.add("error-message");
        element.setAttribute("role", "alert");
    } else {
        element.classList.add("success-message");
        element.setAttribute("role", "status");
    }
}


// ============================================================
// 5. CLEAR MESSAGE FUNCTION
// ============================================================

function clearMessage(elementOrId) {
    let element = elementOrId;

    if (typeof elementOrId === "string") {
        element = document.getElementById(elementOrId);
    }

    if (!element) {
        return;
    }

    element.textContent = "";

    element.classList.add("hidden");

    element.classList.remove(
        "success-message",
        "error-message"
    );
}


// ============================================================
// 6. GENERATE UNIQUE IDs
// ============================================================

function generateId() {
    // Use the browser's UUID generator where available.
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    // Fallback for browsers without randomUUID support.
    return (
        "item-" +
        Date.now() +
        "-" +
        Math.random().toString(36).slice(2, 10)
    );
}


// ============================================================
// 7. DATE FORMATTING
// ============================================================

function formatDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);
}


// ============================================================
// 8. SAFE HTML TEXT ESCAPING
// ============================================================

function escapeHTML(value) {
    const temporaryElement = document.createElement("span");

    temporaryElement.textContent = String(value ?? "");

    return temporaryElement.innerHTML;
}


// ============================================================
// 9. SHARED APPLICATION UTILITIES
// ============================================================

// Make shared functions available to other JavaScript files.
// Other files can access them through window.MealMateApp.

window.MealMateApp = Object.freeze({
    formatCurrency,
    showMessage,
    clearMessage,
    generateId,
    formatDate,
    escapeHTML
});


// ============================================================
// 10. START THE APPLICATION
// ============================================================

function initializeApp() {
    initializeNavigation();
    initializeFooterYear();

    console.log("MealMate SA application initialized successfully.");
}

// The scripts use defer, so the HTML should already be parsed.
// This also supports loading the script without defer.

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}

// ============================================================
// END OF APP.JS
// ============================================================
