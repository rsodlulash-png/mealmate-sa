// ============================================================
// MEALMATE SA
// Recipe Service - TheMealDB Integration
// File: src/services/recipeService.js
// ============================================================

"use strict";


// ============================================================
// 1. CONFIGURATION
// ============================================================

// TheMealDB V1 API.
// Test key 1 is used for development and education.

function getBaseURL() {

    const apiKey = process.env.THEMEALDB_API_KEY || "1";

    return (
        `https://www.themealdb.com/api/json/v1/` +
        `${encodeURIComponent(apiKey)}`
    );

}
const REQUEST_TIMEOUT = 12000;


// ============================================================
// 2. CUSTOM API ERROR
// ============================================================

class RecipeServiceError extends Error {

    constructor(message, status = 502) {

        super(message);

        this.name = "RecipeServiceError";

        this.status = status;

    }

}


// ============================================================
// 3. MAKE REQUESTS TO THEMEALDB
// ============================================================

async function fetchMealDB(endpoint, parameters = {}) {

    const url = new URL(`${getBaseURL()}/${endpoint}`);

    // Add query parameters safely.
    Object.entries(parameters).forEach(function ([key, value]) {

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            url.searchParams.set(key, String(value));

        }

    });


    const controller = new AbortController();

    const timeoutId = setTimeout(function () {

        controller.abort();

    }, REQUEST_TIMEOUT);


    try {

        const response = await fetch(url, {

            method: "GET",

            headers: {
                "Accept": "application/json"
            },

            signal: controller.signal

        });


        if (!response.ok) {

            throw new RecipeServiceError(
                `TheMealDB returned HTTP ${response.status}.`,
                502
            );

        }


        let data;

        try {

            data = await response.json();

        } catch (error) {

            throw new RecipeServiceError(
                "The recipe provider returned invalid JSON.",
                502
            );

        }


        if (
            !data ||
            typeof data !== "object" ||
            !("meals" in data)
        ) {

            throw new RecipeServiceError(
                "The recipe provider returned an unexpected response.",
                502
            );

        }


        return data.meals || [];


    } catch (error) {

        if (error instanceof RecipeServiceError) {
            throw error;
        }


        if (error.name === "AbortError") {

            throw new RecipeServiceError(
                "The recipe provider took too long to respond.",
                504
            );

        }


        console.error(
            "TheMealDB connection error:",
            error.message
        );


        throw new RecipeServiceError(
            "Unable to connect to the recipe provider. Please try again.",
            502
        );


    } finally {

        clearTimeout(timeoutId);

    }

}


// ============================================================
// 4. EXTRACT INGREDIENTS FROM A THEMEALDB RECIPE
// ============================================================

// TheMealDB stores ingredients in numbered fields:
//
// strIngredient1
// strMeasure1
// strIngredient2
// strMeasure2
//
// We convert those fields into an array.

function extractIngredients(meal) {

    const ingredients = [];


    for (let index = 1; index <= 20; index++) {

        const name = meal[`strIngredient${index}`];

        const measure = meal[`strMeasure${index}`];


        if (
            name &&
            String(name).trim()
        ) {

            ingredients.push({

                name: String(name).trim(),

                measure: String(measure || "").trim()

            });

        }

    }


    return ingredients;

}


// ============================================================
// 5. EXTRACT DIETARY TAGS
// ============================================================

function extractDietaryTags(meal) {

    const category = String(
        meal.strCategory || ""
    ).toLowerCase().trim();


    const rawTags = String(
        meal.strTags || ""
    );


    const tags = rawTags
        .split(",")
        .map(function (tag) {
            return tag.toLowerCase().trim();
        })
        .filter(Boolean);


    // TheMealDB has dedicated Vegetarian and Vegan categories.
    // Vegan meals are also vegetarian.

    if (category === "vegan") {

        tags.push("vegan");
        tags.push("vegetarian");

    } else if (category === "vegetarian") {

        tags.push("vegetarian");

    }


    return [...new Set(tags)];

}


// ============================================================
// 6. CONVERT THEMEALDB DATA INTO OUR RECIPE FORMAT
// ============================================================

function normaliseRecipe(meal) {

    if (!meal || typeof meal !== "object") {
        return null;
    }


    if (!meal.idMeal || !meal.strMeal) {
        return null;
    }


    const sourceUrl = meal.strSource || null;


    return {

        // Unique recipe ID.
        id: String(meal.idMeal),


        // Recipe name.
        name: String(meal.strMeal),


        // Recipe photograph.
        image: meal.strMealThumb || null,


        // TheMealDB food category.
        category: meal.strCategory || "Other",


        // Recipe description.
        description: meal.strArea
            ? `${meal.strArea} cuisine recipe.`
            : "Discover this recipe and its ingredients.",


        // Cooking times are not supplied as standard
        // structured fields by this TheMealDB V1 response.
        prepTime: null,

        cookTime: null,

        totalTime: null,


        // Serving quantities are not consistently available.
        servings: null,


        // Structured ingredients and measurements.
        ingredients: extractIngredients(meal),


        // Cooking instructions.
        instructions: meal.strInstructions || "",


        // Dietary categories and tags.
        dietaryTags: extractDietaryTags(meal),


        // Ingredient screening happens separately.
        allergens: [],


        // Do not assume Halaal certification.
        halalCertified: false,


        // TheMealDB does not provide supermarket prices.
        estimatedCost: null,

        priceType: "unavailable",


        // Recipe attribution.
        source: "TheMealDB",

        sourceUrl: sourceUrl,


        // Optional YouTube cooking video.
        videoUrl: meal.strYoutube || null

    };

}


// ============================================================
// 7. REMOVE DUPLICATE RECIPES
// ============================================================


function removeDuplicateRecipes(meals) {

    const uniqueRecipes = new Map();

    meals.forEach(function (meal) {

        // TheMealDB uses idMeal, while our normalised
        // MealMate recipes use id.
        const mealId =
            meal?.id ||
            meal?.idMeal ||
            meal?.recipeId;

        if (
            meal &&
            mealId !== undefined &&
            mealId !== null &&
            String(mealId).trim() !== ""
        ) {

            uniqueRecipes.set(
                String(mealId),
                meal
            );

        }

    });

    return Array.from(uniqueRecipes.values());

}


// ============================================================
// 8. LOOK UP FULL RECIPE DETAILS
// ============================================================

async function getMealById(mealId) {

    if (
        !mealId ||
        !/^\d+$/.test(String(mealId))
    ) {

        throw new RecipeServiceError(
            "A valid recipe ID is required.",
            400
        );

    }


    const meals = await fetchMealDB("lookup.php", {

        i: mealId

    });


    if (!meals.length) {

        throw new RecipeServiceError(
            "The requested recipe could not be found.",
            404
        );

    }


    return normaliseRecipe(meals[0]);

}


// ============================================================
// 9. LOOK UP FULL DETAILS FOR A LIST OF RECIPES
// ============================================================

async function loadFullRecipeDetails(mealSummaries) {

    // Limit simultaneous external requests.
    const selectedMeals = mealSummaries.slice(0, 12);


    const results = await Promise.allSettled(

        selectedMeals.map(function (meal) {

            return getMealById(meal.idMeal);

        })

    );


    const recipes = results

        .filter(function (result) {
            return result.status === "fulfilled";
        })

        .map(function (result) {
            return result.value;
        })

        .filter(Boolean);


    if (recipes.length === 0 && selectedMeals.length > 0) {

        throw new RecipeServiceError(
            "We could not retrieve the full recipe information.",
            502
        );

    }


    return recipes;

}


// ============================================================
// 10. SEARCH RECIPES BY NAME
// ============================================================

async function searchByName(searchTerm) {

    return fetchMealDB("search.php", {

        s: searchTerm

    });

}


// ============================================================
// 11. SEARCH RECIPES BY INGREDIENT
// ============================================================

async function searchByIngredient(ingredient) {

    const formattedIngredient = ingredient
        .trim()
        .replace(/\s+/g, "_");


    return fetchMealDB("filter.php", {

        i: formattedIngredient

    });

}


// ============================================================
// 12. FILTER RECIPES BY CATEGORY
// ============================================================

async function searchByCategory(category) {

    return fetchMealDB("filter.php", {

        c: category

    });

}


// ============================================================
// 13. GET RANDOM RECIPES FOR THE INITIAL PAGE
// ============================================================

// The free V1 API supports one random meal per request.
// We retrieve a few random meals to populate the recipe page.


async function getRandomRecipes() {

    // Request one random meal from TheMealDB.
    const randomMeals = await fetchMealDB("random.php");

    if (!Array.isArray(randomMeals) || randomMeals.length === 0) {

        throw new RecipeServiceError(
            "No random recipe could be retrieved at this time.",
            502
        );

    }

    // Convert the response into our MealMate SA recipe format.
    return randomMeals
        .map(normaliseRecipe)
        .filter(Boolean);

}



// ============================================================
// 14. MAIN RECIPE SEARCH FUNCTION
// ============================================================

async function searchMeals(filters = {}) {

    const searchTerm = String(
        filters.search || ""
    ).trim();


    const category = String(
        filters.category || ""
    ).trim();


    let mealResults = [];


    // --------------------------------------------------------
    // A. Search by name.
    // --------------------------------------------------------

    if (searchTerm) {

        mealResults = await searchByName(searchTerm);


        // If no meal names match, try searching the main ingredient.
        if (!mealResults || mealResults.length === 0) {

            mealResults = await searchByIngredient(searchTerm);

            // Ingredient filtering returns summaries.
            // Retrieve full ingredient and instruction details.
            if (mealResults.length > 0) {

                return loadFullRecipeDetails(mealResults);

            }

            return [];

        }

    }


    // --------------------------------------------------------
    // B. Search by category.
    // --------------------------------------------------------

    else if (category && category !== "all") {

        mealResults = await searchByCategory(category);

        if (!mealResults || mealResults.length === 0) {
            return [];
        }


        // Category filtering returns summaries.
        // Load full recipe information.
        return loadFullRecipeDetails(mealResults);

    }


    // --------------------------------------------------------
    // C. Load random recipes when no search is provided.
    // --------------------------------------------------------

    else {

        return getRandomRecipes();

    }


    // --------------------------------------------------------
    // D. Normalise and remove duplicates.
    // --------------------------------------------------------

    const uniqueMeals = removeDuplicateRecipes(mealResults);


    return uniqueMeals

        .map(normaliseRecipe)

        .filter(Boolean);

}


// ============================================================
// 15. EXPORT PUBLIC FUNCTIONS
// ============================================================

// Other backend files import these functions.

export {

    RecipeServiceError,

    searchMeals,

    getMealById,

    getRandomRecipes,

    extractIngredients,

    normaliseRecipe

};

// ============================================================
// END OF RECIPESERVICE.JS
// ============================================================
