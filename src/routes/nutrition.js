
/**
 * MealMate SA - Nutrition Routes
 *
 * Retrieves recipe ingredients and prepares
 * nutrition requests for the nutrition service.
 */

import express from "express";

import {
    validateNutritionRequest
} from "../utils/validators.js";

import {
    getNutrition
} from "../services/nutritionService.js";

import {
    getMealById
} from "../services/recipeService.js";

import {
    asyncHandler,
    BadRequestError,
    NotFoundError
} from "../utils/errorHandler.js";

const router = express.Router();

/**
 * GET /api/nutrition/:recipeId
 *
 * Retrieves a recipe and extracts its ingredients
 * before requesting nutritional information.
 *
 * Example:
 * GET /api/nutrition/52772
 */
router.get(
    "/:recipeId",
    asyncHandler(async function (req, res) {
        const recipeId = req.params.recipeId;

        // Validate the recipe ID.
        if (!/^\d+$/.test(recipeId)) {
            throw new BadRequestError(
                "Please provide a valid recipe ID."
            );
        }

        // Retrieve the recipe from TheMealDB.
        const recipe = await getMealById(recipeId);

        if (!recipe) {
            throw new NotFoundError(
                "The requested recipe could not be found."
            );
        }

        // Extract ingredient names from the recipe.
        const ingredients = Array.isArray(recipe.ingredients)
            ? recipe.ingredients
                .map(function (ingredient) {
                    return ingredient.name;
                })
                .filter(function (name) {
                    return typeof name === "string" && name.trim() !== "";
                })
            : [];

        if (ingredients.length === 0) {
            throw new BadRequestError(
                "This recipe does not contain usable ingredient information."
            );
        }

        // Validate the extracted ingredients.
        const validatedData = validateNutritionRequest({
            ingredients: ingredients
        });

        // Request nutrition information.
        const nutrition = await getNutrition({
            recipeId: recipeId,
            ingredients: validatedData.ingredients
        });

        return res.status(200).json({
            success: true,
            recipeId: recipeId,
            recipeName: recipe.name,
            ingredientCount: validatedData.ingredients.length,
            nutrition: nutrition
        });
    })
);

export default router;

