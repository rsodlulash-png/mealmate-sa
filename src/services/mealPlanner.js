/**
 * MealMate SA - Meal Planner Service
 *
 * Generates meal plans using household preferences
 * and recipes retrieved from TheMealDB.
 */

import { searchMeals } from "./recipeService.js";

import {
    filterRecipesByAllergies
} from "../utils/allergies.js";

import {
    calculateRecipePortions
} from "../utils/portions.js";

import {
    compareMealPlanWithBudget
} from "../utils/budget.js";

import {
    BadRequestError
} from "../utils/errorHandler.js";

/**
 * Removes duplicate recipes.
 */
function removeDuplicates(recipes) {
    const uniqueRecipes = new Map();

    for (const recipe of recipes) {
        if (recipe && recipe.id) {
            uniqueRecipes.set(String(recipe.id), recipe);
        }
    }

    return Array.from(uniqueRecipes.values());
}

/**
 * Checks whether a recipe matches the requested diet.
 */
/**
 * Checks whether a recipe matches the requested diet.
 * Dietary values are normalised to avoid case-sensitive errors.
 */
function matchesDiet(recipe, diet) {

    const normalisedDiet = String(diet || "")
        .trim()
        .toLowerCase();

    // No dietary restrictions.
    if (
        !normalisedDiet ||
        normalisedDiet === "none" ||
        normalisedDiet === "no restrictions"
    ) {
        return true;
    }

    const tags = Array.isArray(recipe.dietaryTags)
        ? recipe.dietaryTags.map(function (tag) {
            return String(tag).trim().toLowerCase();
        })
        : [];

    // Vegan households.
    if (normalisedDiet === "vegan") {
        return tags.includes("vegan");
    }

    // Vegetarian households can also eat vegan recipes.
    if (normalisedDiet === "vegetarian") {
        return (
            tags.includes("vegetarian") ||
            tags.includes("vegan")
        );
    }

    // Halaal must be explicitly verified.
    if (
        normalisedDiet === "halaal" ||
        normalisedDiet === "halal"
    ) {
        return recipe.halalCertified === true;
    }

    return true;
}

/**
 * Checks whether a recipe matches the household's
 * disliked ingredients.
 */
function matchesDislikedIngredients(recipe, dislikes) {
    if (!Array.isArray(dislikes) || dislikes.length === 0) {
        return true;
    }

    const ingredients = Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : [];

    const ingredientText = ingredients.map(function (ingredient) {
        return [
            ingredient.name || "",
            ingredient.measure || ""
        ].join(" ").toLowerCase();
    }).join(" ");

    return !dislikes.some(function (dislike) {
        return ingredientText.includes(String(dislike).toLowerCase());
    });
}

/**
 * Applies household dietary preferences to recipes.
 *
 * Meal occasions (Breakfast, Lunch and Dinner) are used
 * to organise the plan, not to match TheMealDB categories.
 */
function filterRecipes(recipes, preferences) {
    return recipes.filter(function (recipe) {
        return (
            matchesDiet(recipe, preferences.diet) &&
            matchesDislikedIngredients(
                recipe,
                preferences.dislikedIngredients
            )
        );
    });
}

/**
 * Searches for recipes using available household preferences.
 */
async function findSuitableRecipes(preferences, recipeSearch) {
    const searchTerms = Array.isArray(preferences.searchTerms)
        ? preferences.searchTerms
        : ["chicken", "vegetarian", "pasta"];

    const results = await Promise.all(
        searchTerms.map(function (term) {
            return recipeSearch({ search: term }).catch(function () {
    		return [];
	    });
        })
    );

    let recipes = removeDuplicates(results.flat());

    // Screen against declared allergies.
    // Screen recipes against declared household allergies.
	const allergyResults = filterRecipesByAllergies(
    	recipes,
    	preferences.allergies || []
);

// The allergy utility returns an object.
// Extract the recipes that passed the allergy screening.
recipes = allergyResults.recipes;

    return filterRecipes(recipes, preferences);
}

/**
 * Creates a basic weekly meal plan.
 *
 * @param {Object} preferences - Validated household preferences.
 * @returns {Promise<Object>} Generated meal plan.
 */
export async function generateMealPlan(preferences, options = {}) {
    if (!preferences || typeof preferences !== "object") {
        throw new BadRequestError(
            "Household preferences are required to generate a meal plan."
        );
    }

    const days = Array.isArray(preferences.days)
        ? preferences.days
        : [];

    const mealTypes = Array.isArray(preferences.mealTypes)
        ? preferences.mealTypes
        : [];

    if (days.length === 0 || mealTypes.length === 0) {
        throw new BadRequestError(
            "Please select at least one day and one meal type."
        );
    }

        // Use an injected recipe search function during tests.
	// Normal application requests continue using TheMealDB.
	const recipeSearch =
    	    typeof options.searchMeals === "function"
        	? options.searchMeals
        	: searchMeals;

        const recipes = await findSuitableRecipes(
    	    preferences,
    	    recipeSearch
        );

    if (recipes.length === 0) {
        return {
            success: true,
            message: "No suitable recipes were found. Try adjusting your preferences.",
            mealPlan: [],
            recipeCount: 0
        };
    }


    let recipeIndex = 0;
    const mealPlan = [];
    let householdPortions = null;

    for (const day of days) {
    	for (const mealType of mealTypes) {
            const recipe = recipes[recipeIndex % recipes.length];

            // Calculate portions for this recipe and household.
            householdPortions = calculateRecipePortions(
    		recipe,
    		preferences
	    );
            mealPlan.push({
                day: day,
                mealType: mealType,
                recipe: recipe,
                portions: householdPortions,
                ingredients: recipe.ingredients,
                cost: null,
                costStatus: "unavailable"
            });

            recipeIndex++;
        }
    }

    const budgetComparison = compareMealPlanWithBudget(
    	preferences.weeklyBudget,
    	mealPlan
    );

    return {
        success: true,
        message: "Meal plan generated successfully.",
        householdServings: householdPortions.totalHouseholdServings,
        recipeCount: recipes.length,
        mealCount: mealPlan.length,
        mealPlan: mealPlan,
        budget: budgetComparison,
        allergyNotice:
            "Recipes were screened against declared ingredients only. " +
            "This is not a guarantee of allergy safety. Always verify " +
            "ingredient labels and cross-contact risks."
    };
}
