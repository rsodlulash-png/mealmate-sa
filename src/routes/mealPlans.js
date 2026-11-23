
/**
 * MealMate SA - Meal Plan Routes
 *
 * Handles requests for generating household meal plans.
 */

import express from "express";

import {
    validateMealPlanRequest
} from "../utils/validators.js";

import {
    generateMealPlan
} from "../services/mealPlanner.js";

import {
    asyncHandler,
    BadRequestError
} from "../utils/errorHandler.js";

const router = express.Router();

/**
 * POST /api/meal-plans/generate
 *
 * Receives household preferences and generates a meal plan.
 */
router.post(
    "/generate",
    asyncHandler(async function (req, res) {
        if (!req.body || typeof req.body !== "object") {
            throw new BadRequestError(
                "Please provide household preferences."
            );
        }

        // Validate the information received from the frontend.
        const preferences = validateMealPlanRequest(req.body);

        // Generate the household meal plan.
        const result = await generateMealPlan(preferences);

        return res.status(200).json(result);
    })
);

export default router;
