// ============================================================
// MEALMATE SA
// Meal Planner Service Tests
// File: tests/mealPlanner.test.js
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";

import {
    generateMealPlan
} from "../src/services/mealPlanner.js";


// ============================================================
// TEST HELPERS
// ============================================================

// Create reusable household preferences.
function createPreferences(overrides = {}) {

    return {
        retailer: "Checkers",
        shoppingLocation: "Johannesburg",

        adultCount: 2,
        childCount: 0,
        childAgeGroups: [],

        days: ["Monday"],
        mealTypes: ["Dinner"],

        appliances: ["Stove"],
        diet: "No restrictions",
        cookingStyles: ["Budget-friendly"],

        maxCookingTime: "Any",
        calorieGoalType: "none",

        allergies: [],
        dislikedIngredients: [],

        weeklyBudget: 1500,
        budgetScope: "all-meals",

        pantryItems: [],

        searchTerms: ["chicken"],

        ...overrides
    };

}


// Create reusable sample recipes.
function createRecipe(overrides = {}) {

    return {
        id: "recipe-1",
        name: "Chicken and Rice",
        category: "Chicken",

        servings: 2,

        ingredients: [
            {
                name: "Rice",
                quantity: 1,
                unit: "cup"
            }
        ],

        dietaryTags: [],
        allergens: [],
        halalCertified: false,

        estimatedCost: null,

        ...overrides
    };

}


// ============================================================
// TEST 1: REQUIRE HOUSEHOLD INFORMATION
// ============================================================

test("rejects a request without household preferences", async function () {

    await assert.rejects(
        generateMealPlan(null),
        /Household preferences are required/
    );

});


// ============================================================
// TEST 2: REQUIRE AT LEAST ONE DAY
// ============================================================

test("rejects a meal plan without selected days", async function () {

    const preferences = createPreferences({
        days: []
    });

    await assert.rejects(
        generateMealPlan(preferences),
        /at least one day and one meal type/
    );

});


// ============================================================
// TEST 3: REQUIRE AT LEAST ONE MEAL TYPE
// ============================================================

test("rejects a meal plan without selected meal types", async function () {

    const preferences = createPreferences({
        mealTypes: []
    });

    await assert.rejects(
        generateMealPlan(preferences),
        /at least one day and one meal type/
    );

});


// ============================================================
// TEST 4: USE THE INJECTED RECIPE SEARCH FUNCTION
// ============================================================

test("uses the supplied recipe search function", async function () {

    const preferences = createPreferences();

    const recipe = createRecipe();

    const searchCalls = [];

    const mockSearch = async function (filters) {

        searchCalls.push(filters);

        return [recipe];

    };

    await generateMealPlan(
        preferences,
        {
            searchMeals: mockSearch
        }
    );

    assert.deepEqual(
        searchCalls,
        [{ search: "chicken" }]
    );

});


// ============================================================
// TEST 5: REMOVE DUPLICATE RECIPES
// ============================================================

test("removes duplicate recipes returned by multiple searches", async function () {

    const preferences = createPreferences({
        searchTerms: ["chicken", "rice"]
    });

    const firstRecipe = createRecipe({
        id: "duplicate-1",
        name: "Chicken Rice"
    });

    const secondRecipe = createRecipe({
        id: "duplicate-1",
        name: "Another Chicken Rice"
    });

    const mockSearch = async function (filters) {

        if (filters.search === "chicken") {
            return [firstRecipe];
        }

        return [secondRecipe];

    };

    const result = await generateMealPlan(
        preferences,
        {
            searchMeals: mockSearch
        }
    );

    assert.equal(result.recipeCount, 1);

});


// ============================================================
// TEST 6: GENERATE THE REQUESTED MEAL SCHEDULE
// ============================================================

test("generates the correct number of meals for selected days", async function () {

    const preferences = createPreferences({
        days: ["Monday", "Tuesday"],
        mealTypes: ["Breakfast", "Dinner"]
    });

    const mockSearch = async function () {
        return [createRecipe()];
    };

    const result = await generateMealPlan(
        preferences,
        {
            searchMeals: mockSearch
        }
    );

    assert.equal(result.success, true);

    assert.equal(result.mealCount, 4);

    assert.equal(result.mealPlan.length, 4);

    assert.equal(result.mealPlan[0].day, "Monday");

    assert.equal(result.mealPlan[0].mealType, "Breakfast");

    assert.equal(result.mealPlan[1].mealType, "Dinner");

    assert.equal(result.mealPlan[2].day, "Tuesday");

});


// ============================================================
// TEST 7: CALCULATE HOUSEHOLD PORTIONS
// ============================================================

test("calculates recipe portions for the selected household", async function () {

    const preferences = createPreferences();

    const recipe = createRecipe();

    const mockSearch = async function () {
        return [recipe];
    };

    const result = await generateMealPlan(
        preferences,
        {
            searchMeals: mockSearch
        }
    );

    assert.equal(result.householdServings, 2);

    assert.equal(
        result.mealPlan[0].portions.totalHouseholdServings,
        2
    );

    assert.equal(
        result.mealPlan[0].portions.canScale,
        true
    );

    assert.equal(
        result.mealPlan[0].ingredients[0].quantity,
        1
    );

});


// ============================================================
// TEST 8: EXCLUDE RECIPES WITH DECLARED ALLERGENS
// ============================================================

test("excludes recipes containing a declared household allergen", async function () {

    const preferences = createPreferences({
        allergies: ["Peanuts"]
    });

    const recipes = [
        createRecipe({
            id: "recipe-peanut",
            name: "Peanut Rice",
            ingredients: [
                {
                    name: "Peanuts",
                    quantity: 1,
                    unit: "cup"
                }
            ]
        }),

        createRecipe({
            id: "recipe-safe",
            name: "Chicken Rice"
        })
    ];

    const mockSearch = async function () {
        return recipes;
    };

    const result = await generateMealPlan(
        preferences,
        {
            searchMeals: mockSearch
        }
    );

    assert.equal(result.success, true);

    assert.equal(result.mealPlan.length, 1);

    assert.equal(
        result.mealPlan[0].recipe.id,
        "recipe-safe"
    );

});


// ============================================================
// TEST 9: EXCLUDE DISLIKED INGREDIENTS
// ============================================================

test("excludes recipes containing disliked ingredients", async function () {

    const preferences = createPreferences({
        dislikedIngredients: ["mushroom"]
    });

    const recipes = [
        createRecipe({
            id: "recipe-1",
            ingredients: [
                {
                    name: "Mushrooms",
                    measure: "100g"
                }
            ]
        }),

        createRecipe({
            id: "recipe-2",
            name: "Chicken Rice"
        })
    ];

    const mockSearch = async function () {
        return recipes;
    };

    const result = await generateMealPlan(
        preferences,
        {
            searchMeals: mockSearch
        }
    );

    assert.equal(result.recipeCount, 1);

    assert.equal(
        result.mealPlan[0].recipe.id,
        "recipe-2"
    );

});


// ============================================================
// TEST 10: ENFORCE VEGAN PREFERENCES
// ============================================================

test("only includes vegan recipes when vegan is selected", async function () {

    const preferences = createPreferences({
        diet: "Vegan"
    });

    const recipes = [
        createRecipe({
            id: "meat-recipe",
            dietaryTags: ["meat"]
        }),

        createRecipe({
            id: "vegan-recipe",
            dietaryTags: ["vegan"]
        })
    ];

    const mockSearch = async function () {
        return recipes;
    };

    const result = await generateMealPlan(
        preferences,
        {
            searchMeals: mockSearch
        }
    );

    assert.equal(result.recipeCount, 1);

    assert.equal(
        result.mealPlan[0].recipe.id,
        "vegan-recipe"
    );

});


// ============================================================
// TEST 11: ENFORCE VEGETARIAN PREFERENCES
// ============================================================

test("includes vegetarian and vegan recipes when vegetarian is selected", async function () {

    const preferences = createPreferences({
        diet: "Vegetarian",
	days: ["Monday", "Tuesday"]
    });

    const recipes = [
        createRecipe({
            id: "meat-recipe",
            dietaryTags: ["meat"]
        }),

        createRecipe({
            id: "vegetarian-recipe",
            dietaryTags: ["vegetarian"]
        }),

        createRecipe({
            id: "vegan-recipe",
            dietaryTags: ["vegan"]
        })
    ];

    const mockSearch = async function () {
        return recipes;
    };

    const result = await generateMealPlan(
        preferences,
        {
            searchMeals: mockSearch
        }
    );

    assert.equal(result.recipeCount, 2);

    const recipeIds = result.mealPlan.map(
        meal => meal.recipe.id
    );

    assert.ok(recipeIds.includes("vegetarian-recipe"));

    assert.ok(recipeIds.includes("vegan-recipe"));

});


// ============================================================
// TEST 12: ENFORCE HALAAL CERTIFICATION
// ============================================================

test("only includes explicitly certified Halaal recipes", async function () {

    const preferences = createPreferences({
        diet: "Halaal"
    });

    const recipes = [
        createRecipe({
            id: "unverified-recipe",
            halalCertified: false
        }),

        createRecipe({
            id: "certified-recipe",
            halalCertified: true
        })
    ];

    const mockSearch = async function () {
        return recipes;
    };

    const result = await generateMealPlan(
        preferences,
        {
            searchMeals: mockSearch
        }
    );

    assert.equal(result.recipeCount, 1);

    assert.equal(
        result.mealPlan[0].recipe.id,
        "certified-recipe"
    );

});


// ============================================================
// TEST 13: HANDLE EMPTY RECIPE RESULTS
// ============================================================

test("returns an empty meal plan when no suitable recipes are found", async function () {

    const preferences = createPreferences();

    const mockSearch = async function () {
        return [];
    };

    const result = await generateMealPlan(
        preferences,
        {
            searchMeals: mockSearch
        }
    );

    assert.equal(result.success, true);

    assert.equal(result.recipeCount, 0);

    assert.equal(result.mealPlan.length, 0);

    assert.match(result.message, /No suitable recipes were found/);

});


// ============================================================
// TEST 14: HANDLE RECIPE SEARCH FAILURES
// ============================================================

test("handles external recipe search failures without crashing", async function () {

    const preferences = createPreferences();

    const mockSearch = async function () {
        throw new Error("External recipe service unavailable");
    };

    const result = await generateMealPlan(
        preferences,
        {
            searchMeals: mockSearch
        }
    );

    assert.equal(result.success, true);

    assert.equal(result.recipeCount, 0);

    assert.equal(result.mealPlan.length, 0);

});


// ============================================================
// TEST 15: REPORT UNAVAILABLE RECIPE PRICES
// ============================================================

test("reports incomplete pricing when recipe prices are unavailable", async function () {

    const preferences = createPreferences();

    const recipe = createRecipe({
        estimatedCost: null
    });

    const mockSearch = async function () {
        return [recipe];
    };

    const result = await generateMealPlan(
        preferences,
        {
            searchMeals: mockSearch
        }
    );

    assert.equal(
        result.budget.status,
        "incomplete-pricing"
    );

    assert.equal(
        result.budget.remainingBudget,
        null
    );

    assert.match(
        result.allergyNotice,
        /not a guarantee of allergy safety/
    );

});
