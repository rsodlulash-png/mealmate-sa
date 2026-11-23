/**
 * MealMate SA - Nutrition Service
 *
 * Handles nutritional information for recipes.
 *
 * IMPORTANT:
 * TheMealDB does not provide complete nutritional
 * information in its standard recipe responses.
 * This service therefore reports unavailable values
 * instead of inventing nutritional information.
 */

const NUTRIENT_FIELDS = [
    "calories",
    "protein",
    "carbohydrates",
    "fat"
];

/**
 * Creates an empty nutrition result.
 */
function createUnavailableNutrition(recipeId) {
    return {
        recipeId: String(recipeId),
        available: false,
        source: null,
        servingSize: null,
        nutrients: {
            calories: null,
            protein: null,
            carbohydrates: null,
            fat: null
        },
        message: "Verified nutritional information is not currently available."
    };
}

/**
 * Validates a nutritional value.
 */
function isValidNutrient(value) {
    return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0
    );
}

/**
 * Normalises nutritional information from a trusted provider.
 *
 * This function is ready for integration when a nutrition
 * data provider is connected.
 */
export function normaliseNutritionData(data) {
    if (!data || typeof data !== "object") {
        return null;
    }

    const nutrients = {};

    for (const field of NUTRIENT_FIELDS) {
        const value = data[field];

        nutrients[field] = isValidNutrient(value)
            ? value
            : null;
    }

    const available = NUTRIENT_FIELDS.some(function (field) {
        return nutrients[field] !== null;
    });

    return {
        available: available,
        source: data.source || null,
        servingSize: data.servingSize || null,
        nutrients: nutrients
    };
}

/**
 * Retrieves nutrition information for a recipe.
 *
 * @param {Object} requestData - Validated nutrition request.
 * @returns {Promise<Object>} Nutrition information.
 */
export async function getNutrition(requestData) {
    if (
        !requestData ||
        requestData.recipeId === undefined ||
        requestData.recipeId === null ||
        String(requestData.recipeId).trim() === ""
    ) {
        throw new TypeError(
            "A valid recipe ID is required."
        );
    }

    // No verified nutrition provider is connected yet.
    return createUnavailableNutrition(requestData.recipeId);
}
