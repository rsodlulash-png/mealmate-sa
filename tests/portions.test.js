// ============================================================
// MEALMATE SA
// Household Portion Calculation Tests
// File: tests/portions.test.js
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";

import {
    calculateAdultServings,
    calculateChildServings,
    calculateHouseholdServings,
    scaleIngredientQuantity,
    scaleRecipeIngredients,
    calculateRecipePortions
} from "../src/utils/portions.js";


// ============================================================
// TEST 1: CALCULATE ADULT SERVINGS
// ============================================================

test("calculates servings for two adults", function () {

    const result = calculateAdultServings(2);

    assert.equal(result, 2);

});


// ============================================================
// TEST 2: APPLY AN ADULT PORTION FACTOR
// ============================================================

test("applies a custom adult portion factor", function () {

    const result = calculateAdultServings(2, 1.5);

    assert.equal(result, 3);

});


// ============================================================
// TEST 3: REJECT INVALID ADULT COUNTS
// ============================================================

test("rejects zero adults", function () {

    assert.throws(
        function () {
            calculateAdultServings(0);
        },
        /Adult count/
    );

});


// ============================================================
// TEST 4: CALCULATE CHILD SERVINGS BY AGE GROUP
// ============================================================

test("calculates servings for children in different age groups", function () {

    const children = {
        "3-5 years": 1,
        "6-12 years": 2
    };

    const portionFactors = {
        "3-5 years": 0.5,
        "6-12 years": 0.75
    };

    const result = calculateChildServings(
        children,
        portionFactors
    );

    assert.equal(result.total, 2);

    assert.deepEqual(result.breakdown, {
        "3-5 years": 0.5,
        "6-12 years": 1.5
    });

});


// ============================================================
// TEST 5: REQUIRE CHILD PORTION FACTORS
// ============================================================

test("requires a portion factor for each age group with children", function () {

    assert.throws(
        function () {
            calculateChildServings(
                {
                    "3-5 years": 1
                },
                {}
            );
        },
        /Please configure a portion factor/
    );

});


// ============================================================
// TEST 6: REJECT UNSUPPORTED CHILD AGE GROUPS
// ============================================================

test("rejects unsupported child age groups", function () {

    assert.throws(
        function () {
            calculateChildServings(
                {
                    "18-20 years": 1
                },
                {
                    "18-20 years": 1
                }
            );
        },
        /Unsupported child age group/
    );

});


// ============================================================
// TEST 7: CALCULATE TOTAL HOUSEHOLD SERVINGS
// ============================================================

test("calculates total servings for adults and children", function () {

    const household = {
        adultCount: 2,
        childCount: 3,

        childrenByAgeGroup: {
            "3-5 years": 1,
            "6-12 years": 2
        },

        childPortionFactors: {
            "3-5 years": 0.5,
            "6-12 years": 0.75
        }
    };

    const result = calculateHouseholdServings(household);

    assert.equal(result.adultServings, 2);

    assert.equal(result.childServings, 2);

    assert.equal(result.totalHouseholdServings, 4);

    assert.equal(result.adultCount, 2);

    assert.equal(result.childCount, 3);

});


// ============================================================
// TEST 8: REJECT CHILD COUNT MISMATCH
// ============================================================

test("rejects household child counts that do not match age groups", function () {

    const household = {
        adultCount: 2,
        childCount: 3,

        childrenByAgeGroup: {
            "3-5 years": 1
        },

        childPortionFactors: {
            "3-5 years": 0.5
        }
    };

    assert.throws(
        function () {
            calculateHouseholdServings(household);
        },
        /must equal the total number of children/
    );

});


// ============================================================
// TEST 9: SCALE A SINGLE INGREDIENT
// ============================================================

test("scales an ingredient quantity correctly", function () {

    const result = scaleIngredientQuantity(
        2,
        4,
        6
    );

    assert.equal(result, 3);

});


// ============================================================
// TEST 10: SCALE STRUCTURED RECIPE INGREDIENTS
// ============================================================

test("scales ingredients with numerical quantities and units", function () {

    const ingredients = [
        {
            name: "Rice",
            quantity: 2,
            unit: "cups"
        },
        {
            name: "Water",
            quantity: 4,
            unit: "cups"
        }
    ];

    const result = scaleRecipeIngredients(
        ingredients,
        2,
        4
    );

    assert.equal(result.canScale, true);

    assert.equal(result.baseServings, 2);

    assert.equal(result.targetServings, 4);

    assert.equal(result.ingredients[0].quantity, 4);

    assert.equal(result.ingredients[1].quantity, 8);

});


// ============================================================
// TEST 11: DO NOT AUTOMATICALLY SCALE TEXT MEASUREMENTS
// ============================================================

test("does not scale ingredients with unstructured measurements", function () {

    const ingredients = [
        {
            name: "Rice",
            measure: "2 cups"
        }
    ];

    const result = scaleRecipeIngredients(
        ingredients,
        2,
        4
    );

    assert.equal(result.canScale, false);

    assert.equal(result.ingredients[0].measure, "2 cups");

    assert.match(result.reason, /Manual adjustment is required/);

});


// ============================================================
// TEST 12: CALCULATE PORTIONS WHEN SERVINGS ARE MISSING
// ============================================================

test("reports when original recipe servings are unavailable", function () {

    const recipe = {
        name: "Chicken Rice",
        ingredients: [
            {
                name: "Rice",
                measure: "2 cups"
            }
        ]
    };

    const household = {
        adultCount: 2,
        childCount: 0
    };

    const result = calculateRecipePortions(
        recipe,
        household
    );

    assert.equal(result.totalHouseholdServings, 2);

    assert.equal(result.canScale, false);

    assert.match(
        result.reason,
        /did not supply its original serving size/
    );

});


// ============================================================
// TEST 13: CALCULATE AND SCALE A COMPLETE RECIPE
// ============================================================

test("calculates and scales a recipe for the household", function () {

    const recipe = {
        name: "Rice",
        servings: 4,

        ingredients: [
            {
                name: "Rice",
                quantity: 4,
                unit: "cups"
            }
        ]
    };

    const household = {
        adultCount: 2,
        childCount: 0
    };

    const result = calculateRecipePortions(
        recipe,
        household
    );

    assert.equal(result.canScale, true);

    assert.equal(result.baseServings, 4);

    assert.equal(result.targetServings, 2);

    assert.equal(result.ingredients[0].quantity, 2);

});


// ============================================================
// TEST 14: REJECT INVALID RECIPE INFORMATION
// ============================================================

test("rejects an invalid recipe", function () {

    assert.throws(
        function () {
            calculateRecipePortions(
                null,
                {
                    adultCount: 2,
                    childCount: 0
                }
            );
        },
        /A valid recipe is required/
    );

});
