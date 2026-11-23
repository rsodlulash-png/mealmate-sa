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
function matchesDiet(recipe, diet) {
    if (!diet || diet === "none") {
        return true;
    }

    const tags = Array.isArray(recipe.dietTags)
        ? recipe.dietTags.map(function (tag) {
            return String(tag).toLowerCase();
        })
        : [];

    if (diet === "vegan") {
        return tags.includes("vegan");
    }

    if (diet === "vegetarian") {
        return tags.includes("vegetarian") || tags.includes("vegan");
    }

    if (diet === "halaal" || diet === "halal") {
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
 * Checks whether a recipe belongs to the requested meal type.
 *
 * TheMealDB categories are not the same as meal occasions.
 * This check only uses the recipe category when a requested
 * meal type happens to match it.
 */
function matchesMealType(recipe, mealTypes) {
    if (!Array.isArray(mealTypes) || mealTypes.length === 0) {
        return true;
    }

    return mealTypes.some(function (mealType) {
        return String(recipe.category || "").toLowerCase() ===
            String(mealType).toLowerCase();
    });
}

/**
 * Applies household preferences to recipes.
 */
function filterRecipes(recipes, preferences) {
    return recipes.filter(function (recipe) {
        return (
            matchesDiet(recipe, preferences.diet) &&
            matchesDislikedIngredients(
                recipe,
                preferences.dislikedIngredients
            ) &&
            matchesMealType(recipe, preferences.mealTypes)
        );
    });
}

/**
 * Searches for recipes using available household preferences.
 */
async function findSuitableRecipes(preferences) {
    const searchTerms = Array.isArray(preferences.searchTerms)
        ? preferences.searchTerms
        : ["chicken", "vegetarian", "pasta"];

    const results = await Promise.all(
        searchTerms.map(function (term) {
            return searchMeals({ search: term }).catch(function () {
                return [];
            });
        })
    );

    let recipes = removeDuplicates(results.flat());

    // Screen against declared allergies.
    const allergyResults = filterRecipesByAllergies(
        recipes,
        preferences.allergies || []
    );

    recipes = allergyResults.filter(function (recipe) {
        return recipe.suitableByDeclaredAllergies === true;
    });

    return filterRecipes(recipes, preferences);
}

/**
 * Creates a basic weekly meal plan.
 *
 * @param {Object} preferences - Validated household preferences.
 * @returns {Promise<Object>} Generated meal plan.
 */
export async function generateMealPlan(preferences) {
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

    const recipes = await findSuitableRecipes(preferences);

    if (recipes.length === 0) {
        return {
            success: true,
            message: "No suitable recipes were found. Try adjusting your preferences.",
            mealPlan: [],
            recipeCount: 0
        };
    }

    const householdPortions = calculateRecipePortions(preferences);

    let recipeIndex = 0;
    const mealPlan = [];

    for (const day of days) {
        for (const mealType of mealTypes) {
            const recipe = recipes[recipeIndex % recipes.length];

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
        mealPlan,
        preferences.weeklyBudget
    );

    return {
        success: true,
        message: "Meal plan generated successfully.",
        householdServings: householdPortions.householdServings,
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
