
// ============================================================
// MEALMATE SA
// Household Portion and Ingredient Calculations
// File: src/utils/portions.js
// ============================================================

"use strict";


// ============================================================
// 1. SUPPORTED CHILD AGE GROUPS
// ============================================================

const CHILD_AGE_GROUPS = [
    "0-2 years",
    "3-5 years",
    "6-12 years",
    "13-17 years"
];


// ============================================================
// 2. VALIDATE A NUMBER
// ============================================================

function validatePositiveNumber(value, fieldName) {

    const number = Number(value);

    if (
        !Number.isFinite(number) ||
        number <= 0
    ) {
        throw new Error(
            `${fieldName} must be a number greater than zero.`
        );
    }

    return number;

}


// ============================================================
// 3. VALIDATE A HOUSEHOLD COUNT
// ============================================================

function validateCount(value, fieldName, minimum = 0) {

    const number = Number(value);

    if (
        !Number.isInteger(number) ||
        number < minimum
    ) {
        throw new Error(
            `${fieldName} must be a whole number of at least ${minimum}.`
        );
    }

    return number;

}


// ============================================================
// 4. ROUND A NUMBER
// ============================================================

function roundQuantity(value, precision = 2) {

    if (
        !Number.isInteger(precision) ||
        precision < 0 ||
        precision > 6
    ) {
        throw new Error(
            "Precision must be a whole number between 0 and 6."
        );
    }

    const multiplier = 10 ** precision;

    return Math.round(
        (value + Number.EPSILON) * multiplier
    ) / multiplier;

}


// ============================================================
// 5. CALCULATE ADULT SERVINGS
// ============================================================

// By default, one adult is counted as one adult-equivalent
// serving. This is a recipe-planning unit, not a calorie target.

function calculateAdultServings(
    adultCount,
    adultPortionFactor = 1
) {

    const adults = validateCount(
        adultCount,
        "Adult count",
        1
    );

    const factor = validatePositiveNumber(
        adultPortionFactor,
        "Adult portion factor"
    );

    return roundQuantity(adults * factor, 2);

}


// ============================================================
// 6. CALCULATE CHILD SERVINGS
// ============================================================

// Children are calculated separately for each age group.
//
// Expected example:
//
// childrenByAgeGroup: {
//     "3-5 years": 1,
//     "6-12 years": 2
// }
//
// childPortionFactors: {
//     "3-5 years": 0.5,
//     "6-12 years": 0.75
// }
//
// These values are illustrative user-configurable factors.
// They are not medically established portion recommendations.

function calculateChildServings(
    childrenByAgeGroup = {},
    childPortionFactors = {}
) {

    if (
        !childrenByAgeGroup ||
        typeof childrenByAgeGroup !== "object" ||
        Array.isArray(childrenByAgeGroup)
    ) {
        throw new Error(
            "Children must be grouped by age group."
        );
    }

    if (
        !childPortionFactors ||
        typeof childPortionFactors !== "object" ||
        Array.isArray(childPortionFactors)
    ) {
        throw new Error(
            "Child portion factors must be provided as an object."
        );
    }


    let totalChildServings = 0;

    const breakdown = {};


    Object.entries(childrenByAgeGroup).forEach(
        function ([ageGroup, countValue]) {

            // Validate age group.
            if (!CHILD_AGE_GROUPS.includes(ageGroup)) {

                throw new Error(
                    `Unsupported child age group: ${ageGroup}.`
                );

            }


            const count = validateCount(
                countValue,
                `Children in ${ageGroup}`
            );


            if (count === 0) {
                breakdown[ageGroup] = 0;
                return;
            }


            // A portion factor must be explicitly provided.
            // We do not assume all children need identical portions.
            const suppliedFactor = childPortionFactors[ageGroup];


            if (
                suppliedFactor === undefined ||
                suppliedFactor === null
            ) {

                throw new Error(
                    `Please configure a portion factor for children aged ${ageGroup}.`
                );

            }


            const factor = validatePositiveNumber(
                suppliedFactor,
                `Portion factor for ${ageGroup}`
            );


            const groupServings = roundQuantity(
                count * factor,
                2
            );


            breakdown[ageGroup] = groupServings;

            totalChildServings += groupServings;

        }
    );


    return {

        total: roundQuantity(totalChildServings, 2),

        breakdown: breakdown

    };

}


// ============================================================
// 7. CALCULATE TOTAL HOUSEHOLD SERVINGS
// ============================================================

function calculateHouseholdServings(household) {

    if (
        !household ||
        typeof household !== "object"
    ) {
        throw new Error(
            "Household information is required."
        );
    }


    const adultCount = validateCount(
        household.adultCount,
        "Adult count",
        1
    );

    const childCount = validateCount(
        household.childCount ?? 0,
        "Child count"
    );


    // Calculate adult portions.
    const adultServings = calculateAdultServings(
        adultCount,
        household.adultPortionFactor ?? 1
    );


    // Children must be distributed across their age groups.
    // We cannot infer the number of children in each group
    // from a list of selected age groups alone.
    let childResults = {
        total: 0,
        breakdown: {}
    };


    if (childCount > 0) {

        const childrenByAgeGroup =
            household.childrenByAgeGroup;


        if (
            !childrenByAgeGroup ||
            typeof childrenByAgeGroup !== "object" ||
            Array.isArray(childrenByAgeGroup)
        ) {

            throw new Error(
                "Please provide the number of children in each age group."
            );

        }


        const groupedChildCount = Object.values(
            childrenByAgeGroup
        ).reduce(function (total, count) {

            return total + validateCount(
                count,
                "Child age-group count"
            );

        }, 0);


        if (groupedChildCount !== childCount) {

            throw new Error(
                "The number of children in the age groups must equal the total number of children."
            );

        }


        childResults = calculateChildServings(

            childrenByAgeGroup,

            household.childPortionFactors || {}

        );

    }


    const totalServings = roundQuantity(
        adultServings + childResults.total,
        2
    );


    return {

        adultCount: adultCount,

        childCount: childCount,

        adultServings: adultServings,

        childServings: childResults.total,

        childBreakdown: childResults.breakdown,

        totalHouseholdServings: totalServings

    };

}


// ============================================================
// 8. SCALE A SINGLE INGREDIENT QUANTITY
// ============================================================

// Formula:
//
// New quantity = Original quantity x (Target servings / Base servings)

function scaleIngredientQuantity(
    originalQuantity,
    baseServings,
    targetServings,
    precision = 2
) {

    const quantity = validatePositiveNumber(
        originalQuantity,
        "Original ingredient quantity"
    );

    const base = validatePositiveNumber(
        baseServings,
        "Original recipe servings"
    );

    const target = validatePositiveNumber(
        targetServings,
        "Target recipe servings"
    );


    const scaledQuantity = quantity * (target / base);


    return roundQuantity(
        scaledQuantity,
        precision
    );

}


// ============================================================
// 9. SCALE ALL STRUCTURED RECIPE INGREDIENTS
// ============================================================

// Example ingredient format:
//
// {
//     name: "Rice",
//     quantity: 2,
//     unit: "kg"
// }
//
// Text measurements such as "2 cups" or "1 handful"
// must not be interpreted automatically.

function scaleRecipeIngredients(
    ingredients,
    baseServings,
    targetServings,
    precision = 2
) {

    if (!Array.isArray(ingredients)) {

        throw new Error(
            "Recipe ingredients must be provided as an array."
        );

    }


    if (ingredients.length === 0) {

        throw new Error(
            "The recipe does not contain ingredient information."
        );

    }


    const base = validatePositiveNumber(
        baseServings,
        "Original recipe servings"
    );

    const target = validatePositiveNumber(
        targetServings,
        "Target recipe servings"
    );


    // Check the entire ingredient list before scaling anything.
    const canScale = ingredients.every(function (ingredient) {

        return (
            ingredient &&
            Number.isFinite(Number(ingredient.quantity)) &&
            Number(ingredient.quantity) > 0 &&
            typeof ingredient.unit === "string" &&
            ingredient.unit.trim().length > 0
        );

    });


    if (!canScale) {

        return {

            canScale: false,

            reason:
                "Some ingredients do not have structured numerical quantities and units. Manual adjustment is required.",

            ingredients: ingredients

        };

    }


    const scaledIngredients = ingredients.map(
        function (ingredient) {

            return {

                ...ingredient,

                originalQuantity: Number(ingredient.quantity),

                quantity: scaleIngredientQuantity(

                    ingredient.quantity,

                    base,

                    target,

                    precision

                )

            };

        }
    );


    return {

        canScale: true,

        baseServings: base,

        targetServings: target,

        ingredients: scaledIngredients

    };

}


// ============================================================
// 10. CALCULATE A COMPLETE RECIPE FOR A HOUSEHOLD
// ============================================================

function calculateRecipePortions(recipe, household) {

    if (
        !recipe ||
        typeof recipe !== "object"
    ) {
        throw new Error(
            "A valid recipe is required."
        );
    }


    const householdResults = calculateHouseholdServings(
        household
    );


    const baseServings = recipe.servings ??
        recipe.baseServings ??
        null;


    if (
        baseServings === null ||
        baseServings === undefined
    ) {

        return {

            ...householdResults,

            canScale: false,

            reason:
                "The recipe provider did not supply its original serving size.",

            ingredients: recipe.ingredients || []

        };

    }


    const scaled = scaleRecipeIngredients(

        recipe.ingredients,

        baseServings,

        householdResults.totalHouseholdServings

    );


    return {

        ...householdResults,

        canScale: scaled.canScale,

        reason: scaled.reason || null,

        baseServings: baseServings,

        targetServings:
            householdResults.totalHouseholdServings,

        ingredients: scaled.ingredients

    };

}


// ============================================================
// 11. EXPORT PUBLIC FUNCTIONS
// ============================================================

export {

    CHILD_AGE_GROUPS,

    calculateAdultServings,

    calculateChildServings,

    calculateHouseholdServings,

    scaleIngredientQuantity,

    scaleRecipeIngredients,

    calculateRecipePortions

};


// ============================================================
// END OF PORTIONS.JS
// ============================================================
