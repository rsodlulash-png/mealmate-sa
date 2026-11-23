// ============================================================
// MEALMATE SA
// Recipe API Routes
// File: src/routes/recipes.js
// ============================================================

"use strict";

// ============================================================
// 1. IMPORT REQUIRED MODULES
// ============================================================

import express from "express";

import {
    searchMeals,
    getMealById,
    RecipeServiceError
} from "../services/recipeService.js";


// ============================================================
// 2. INITIALIZE ROUTER
// ============================================================

const router = express.Router();


// ============================================================
// 3. VALIDATE SEARCH INPUT
// ============================================================

function validateSearch(search) {

    if (typeof search !== "string") {
        return "Search must be text.";
    }

    if (search.length > 80) {
        return "Search must not exceed 80 characters.";
    }

    return null;

}


// ============================================================
// 4. VALIDATE CATEGORY INPUT
// ============================================================

function validateCategory(category) {

    if (typeof category !== "string") {
        return "Category must be text.";
    }

    if (category.length > 40) {
        return "Category must not exceed 40 characters.";
    }

    // Categories should contain letters, spaces or hyphens.
    if (!/^[a-zA-Z][a-zA-Z\s-]*$/.test(category)) {
        return "Invalid recipe category.";
    }

    return null;

}


// ============================================================
// 5. GET AND SEARCH RECIPES
// ============================================================

// Endpoint:
// GET /api/recipes
//
// Examples:
// /api/recipes
// /api/recipes?search=chicken
// /api/recipes?category=Vegetarian
// /api/recipes?search=chicken&category=Beef

router.get("/", async function (req, res, next) {

    try {

        const search = req.query.search === undefined
            ? ""
            : req.query.search;


        const category = req.query.category === undefined
            ? ""
            : req.query.category;


        // Validate query types.
        const searchError = validateSearch(search);

        if (searchError) {

            return res.status(400).json({

                success: false,

                message: searchError

            });

        }


        const categoryError =
            category === "" || category === "all"
                ? null
                : validateCategory(category);


        if (categoryError) {

            return res.status(400).json({

                success: false,

                message: categoryError

            });

        }


        // Retrieve recipes from TheMealDB.
        const recipes = await searchMeals({

            search: search.trim(),

            category:
                category === "all"
                    ? ""
                    : category.trim()

        });


        // TheMealDB searches by name or category separately.
        // When both are supplied, filter the name results locally.
        let filteredRecipes = recipes;


        if (
            search.trim() &&
            category &&
            category !== "all"
        ) {

            filteredRecipes = recipes.filter(function (recipe) {

                return String(recipe.category).toLowerCase() ===
                    category.trim().toLowerCase();

            });

        }


        // Return a consistent response to the frontend.
        return res.status(200).json({

            success: true,

            count: filteredRecipes.length,

            recipes: filteredRecipes

        });


    } catch (error) {

        next(error);

    }

});


// ============================================================
// 6. GET COMPLETE DETAILS FOR ONE RECIPE
// ============================================================

// Endpoint:
// GET /api/recipes/:id
//
// Example:
// /api/recipes/52772

router.get("/:id", async function (req, res, next) {

    try {

        const recipeId = req.params.id;


        // Check that the recipe ID contains numbers only.
        if (!/^\d+$/.test(recipeId)) {

            return res.status(400).json({

                success: false,

                message: "Please provide a valid recipe ID."

            });

        }


        // Retrieve complete recipe information.
        const recipe = await getMealById(recipeId);


        return res.status(200).json({

            success: true,

            recipe: recipe

        });


    } catch (error) {

        next(error);

    }

});


// ============================================================
// 7. RECIPE ROUTE ERROR HANDLER
// ============================================================

router.use(function (error, req, res, next) {

    console.error("Recipe route error:", error.message);


    if (error instanceof RecipeServiceError) {

        return res.status(error.status).json({

            success: false,

            message: error.message

        });

    }


    return res.status(500).json({

        success: false,

        message: "Unable to process your recipe request."

    });

});


// ============================================================
// 8. EXPORT ROUTER
// ============================================================

export default router;


// ============================================================
// END OF RECIPES.JS
// ============================================================
