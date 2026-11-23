
// ============================================================
// MEALMATE SA
// Recipe Allergy Screening
// File: src/utils/allergies.js
// ============================================================

"use strict";


// ============================================================
// 1. KNOWN ALLERGENS AND THEIR INGREDIENT NAMES
// ============================================================

// These patterns identify common allergen terms in the
// ingredient information returned by recipe providers.
//
// This is ingredient screening, NOT a food-safety guarantee.

const ALLERGEN_RULES = {

    "Peanuts": [
        /\bpeanuts?\b/i,
        /\bgroundnuts?\b/i
    ],

    "Tree nuts": [
        /\balmonds?\b/i,
        /\bcashews?\b/i,
        /\bwalnuts?\b/i,
        /\bpecans?\b/i,
        /\bpistachios?\b/i,
        /\bhazelnuts?\b/i,
        /\bmacadamias?\b/i,
        /\bbrazil nuts?\b/i
    ],

    "Dairy": [
        /\bmilk\b/i,
        /\bcheese\b/i,
        /\bcream\b/i,
        /\bbutter\b/i,
        /\byoghurt\b/i,
        /\byogurt\b/i,
        /\bwhey\b/i,
        /\bcasein\b/i,
        /\bghee\b/i,
        /\bbuttermilk\b/i
    ],

    "Eggs": [
        /\beggs?\b/i,
        /\balbumen\b/i,
        /\bovalbumin\b/i
    ],

    "Gluten/Wheat": [
        /\bwheat\b/i,
        /\bbarley\b/i,
        /\brye\b/i,
        /\bcouscous\b/i,
        /\bbulgur\b/i,
        /\bsemolina\b/i,
        /\bspelt\b/i,
        /\bfarro\b/i,
        /\bbreadcrumbs?\b/i,
        /\bbread crumbs\b/i,
        /\bwheat flour\b/i,
        /\bplain flour\b/i,
        /\ball-purpose flour\b/i,
        /\bbread flour\b/i,
        /\bself[- ]raising flour\b/i
    ],

    "Soy": [
        /\bsoy\b/i,
        /\bsoya\b/i,
        /\btofu\b/i,
        /\bedamame\b/i,
        /\bmiso\b/i,
        /\btempeh\b/i
    ],

    "Fish": [
        /\bfish\b/i,
        /\bsalmon\b/i,
        /\btuna\b/i,
        /\bsardines?\b/i,
        /\banchovies?\b/i,
        /\bcod\b/i,
        /\bhaddock\b/i,
        /\bmackerel\b/i,
        /\bfish sauce\b/i
    ],

    "Shellfish": [
        /\bshellfish\b/i,
        /\bprawns?\b/i,
        /\bshrimps?\b/i,
        /\bcrabs?\b/i,
        /\blobsters?\b/i,
        /\bcrayfish\b/i,
        /\bmussels?\b/i,
        /\boysters?\b/i,
        /\bclams?\b/i,
        /\bscallops?\b/i,
        /\bsquid\b/i
    ],

    "Sesame": [
        /\bsesame\b/i,
        /\btahini\b/i
    ]

};


// ============================================================
// 2. NORMALISE TEXT
// ============================================================

// Convert text to a consistent format before comparison.

function normaliseText(value) {

    return String(value || "")
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}


// ============================================================
// 3. GET INGREDIENT NAMES FROM A RECIPE
// ============================================================

// Supports both MealMate's normalised recipe format
// and the original numbered TheMealDB ingredient fields.

function extractRecipeIngredientNames(recipe) {

    if (!recipe || typeof recipe !== "object") {
        return [];
    }


    let ingredients = [];


    // Handle normalised ingredient arrays.
    if (Array.isArray(recipe.ingredients)) {

        ingredients = recipe.ingredients.map(function (ingredient) {

            if (typeof ingredient === "string") {
                return ingredient;
            }

            if (ingredient && typeof ingredient === "object") {
                return (
                    ingredient.name ||
                    ingredient.ingredient ||
                    ""
                );
            }

            return "";

        });

    }


    // Handle original TheMealDB ingredient fields.
    else {

        for (let index = 1; index <= 20; index++) {

            const ingredient = recipe[`strIngredient${index}`];

            if (ingredient && String(ingredient).trim()) {
                ingredients.push(String(ingredient));
            }

        }

    }


    // Include any allergen information supplied by a provider.
    if (Array.isArray(recipe.allergens)) {

        ingredients.push(...recipe.allergens);

    }


    return ingredients

        .map(function (ingredient) {
            return String(ingredient).trim();
        })

        .filter(Boolean);

}


// ============================================================
// 4. PREPARE INGREDIENT TEXT
// ============================================================

function prepareIngredientText(recipe) {

    const ingredientNames = extractRecipeIngredientNames(recipe);

    let ingredientText = normaliseText(
        ingredientNames.join(" ")
    );


    // Coconut, oat, rice, almond and soy milk are plant-based.
    // Do not automatically classify their word "milk" as dairy.
    // Their respective plant ingredients remain available
    // for other allergen checks (e.g. almond and soy).

    const plantMilkExpressions = [
        /\bcoconut milk\b/g,
        /\boat milk\b/g,
        /\brice milk\b/g,
        /\balmond milk\b/g,
        /\bsoy milk\b/g,
        /\bsoya milk\b/g
    ];


    plantMilkExpressions.forEach(function (expression) {

        ingredientText = ingredientText.replace(expression, "");

    });


    return {
        names: ingredientNames,
        text: ingredientText
    };

}


// ============================================================
// 5. NORMALISE ALLERGY NAMES
// ============================================================

function findKnownAllergen(allergyName) {

    const normalisedName = normaliseText(allergyName);


    return Object.keys(ALLERGEN_RULES).find(function (name) {

        return normaliseText(name) === normalisedName;

    }) || null;

}


// ============================================================
// 6. CHECK WHETHER AN INGREDIENT MATCHES AN ALLERGEN
// ============================================================

function ingredientMatchesPattern(ingredientText, patterns) {

    return patterns.some(function (pattern) {

        return pattern.test(ingredientText);

    });

}


// ============================================================
// 7. SCREEN A SINGLE RECIPE
// ============================================================

function screenRecipeForAllergies(
    recipe,
    selectedAllergies = []
) {

    if (!recipe || typeof recipe !== "object") {

        throw new TypeError("A valid recipe object is required.");

    }


    if (!Array.isArray(selectedAllergies)) {

        throw new TypeError("Selected allergies must be an array.");

    }


    const ingredientData = prepareIngredientText(recipe);

    const ingredientText = ingredientData.text;


    const matchedAllergies = [];

    const evidence = {};


    // Check every allergy selected by the household.
    selectedAllergies.forEach(function (allergy) {

        if (
            typeof allergy !== "string" ||
            !allergy.trim()
        ) {
            return;
        }


        const knownAllergen = findKnownAllergen(allergy);


        // Check known allergen categories.
        if (knownAllergen) {

            const patterns = ALLERGEN_RULES[knownAllergen];


            if (
                ingredientMatchesPattern(
                    ingredientText,
                    patterns
                )
            ) {

                if (!matchedAllergies.includes(knownAllergen)) {

                    matchedAllergies.push(knownAllergen);

                    evidence[knownAllergen] =
                        ingredientData.names.filter(function (name) {

                            const normalisedName = normaliseText(name);

                            return ingredientMatchesPattern(
                                normalisedName,
                                patterns
                            );

                        });

                }

            }

            return;

        }


        // Handle custom allergies supplied by the user.
        // Match the complete phrase, not just a partial word.

        const customAllergy = normaliseText(allergy);

        const escapedAllergy = customAllergy.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        const customPattern = new RegExp(
            `(^|[^a-z0-9])${escapedAllergy}(?=$|[^a-z0-9])`,
            "i"
        );


        if (customPattern.test(ingredientText)) {

            if (!matchedAllergies.includes(allergy)) {

                matchedAllergies.push(allergy);

                evidence[allergy] =
                    ingredientData.names.filter(function (name) {

                        return customPattern.test(
                            normaliseText(name)
                        );

                    });

            }

        }

    });


    // Detect known allergen categories present in the recipe.
    // This provides additional information for the frontend.

    const detectedAllergens = [];


    Object.entries(ALLERGEN_RULES).forEach(
        function ([allergen, patterns]) {

            if (
                ingredientMatchesPattern(
                    ingredientText,
                    patterns
                )
            ) {

                detectedAllergens.push(allergen);

            }

        }
    );


    const containsDeclaredAllergen =
        matchedAllergies.length > 0;


    return {

        // False means a declared allergen was found
        // in the ingredient information provided.

        suitableByDeclaredAllergies:
            !containsDeclaredAllergen,

        containsDeclaredAllergen:
            containsDeclaredAllergen,

        matchedAllergies:
            matchedAllergies,

        detectedAllergens:
            detectedAllergens,

        evidence:
            evidence,

        // Never communicate this result as a safety guarantee.
        note:
            "No matching declared allergen was identified in the listed ingredients. " +
            "Check packaging, hidden ingredients and cross-contact warnings."

    };

}


// ============================================================
// 8. FILTER A COLLECTION OF RECIPES
// ============================================================

function filterRecipesByAllergies(
    recipes,
    selectedAllergies = []
) {

    if (!Array.isArray(recipes)) {

        throw new TypeError("Recipes must be provided as an array.");

    }


    const safeForDeclaredAllergies = [];

    const excludedRecipes = [];


    recipes.forEach(function (recipe) {

        const result = screenRecipeForAllergies(
            recipe,
            selectedAllergies
        );


        if (result.suitableByDeclaredAllergies) {

            safeForDeclaredAllergies.push(recipe);

        } else {

            excludedRecipes.push({

                recipe: recipe,

                reasons: result.matchedAllergies,

                evidence: result.evidence

            });

        }

    });


    return {

        recipes: safeForDeclaredAllergies,

        excludedRecipes: excludedRecipes,

        totalChecked: recipes.length,

        totalIncluded: safeForDeclaredAllergies.length,

        totalExcluded: excludedRecipes.length

    };

}


// ============================================================
// 9. EXPORT FUNCTIONS
// ============================================================

export {

    ALLERGEN_RULES,

    normaliseText,

    extractRecipeIngredientNames,

    screenRecipeForAllergies,

    filterRecipesByAllergies

};


// ============================================================
// END OF ALLERGIES.JS
// ============================================================
