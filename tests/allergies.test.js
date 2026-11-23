// ============================================================
// MEALMATE SA
// Allergy Utility Tests
// File: tests/allergies.test.js
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";

import {
    extractRecipeIngredientNames,
    screenRecipeForAllergies,
    filterRecipesByAllergies
} from "../src/utils/allergies.js";


// ============================================================
// TEST 1: EXTRACT INGREDIENT NAMES
// ============================================================

test("extracts ingredient names from a recipe", function () {

    const recipe = {
        ingredients: [
            "Chicken",
            { name: "Onion" },
            { ingredient: "Rice" },
            null
        ],
        allergens: ["Dairy"]
    };

    const result = extractRecipeIngredientNames(recipe);

    assert.deepEqual(
        result,
        ["Chicken", "Onion", "Rice", "Dairy"]
    );

});


// ============================================================
// TEST 2: DETECT PEANUT ALLERGIES
// ============================================================

test("detects peanuts in recipe ingredients", function () {

    const recipe = {
        ingredients: [
            { name: "Peanuts", measure: "2 tablespoons" },
            { name: "Rice", measure: "1 cup" }
        ]
    };

    const result = screenRecipeForAllergies(
        recipe,
        ["Peanuts"]
    );

    assert.equal(
        result.suitableByDeclaredAllergies,
        false
    );

    assert.equal(
        result.containsDeclaredAllergen,
        true
    );

    assert.deepEqual(
        result.matchedAllergies,
        ["Peanuts"]
    );

});


// ============================================================
// TEST 3: DETECT ALLERGENS WITHOUT CASE SENSITIVITY
// ============================================================

test("detects dairy ingredients regardless of letter case", function () {

    const recipe = {
        ingredients: [
            { name: "WHOLE MILK", measure: "1 cup" }
        ]
    };

    const result = screenRecipeForAllergies(
        recipe,
        ["Dairy"]
    );

    assert.equal(
        result.suitableByDeclaredAllergies,
        false
    );

    assert.deepEqual(
        result.matchedAllergies,
        ["Dairy"]
    );

});


// ============================================================
// TEST 4: ALLOW RECIPES WITHOUT A MATCHING DECLARED ALLERGEN
// ============================================================

test("allows a recipe with no matching declared allergen", function () {

    const recipe = {
        ingredients: [
            { name: "Chicken" },
            { name: "Rice" },
            { name: "Salt" }
        ]
    };

    const result = screenRecipeForAllergies(
        recipe,
        ["Peanuts"]
    );

    assert.equal(
        result.suitableByDeclaredAllergies,
        true
    );

    assert.equal(
        result.containsDeclaredAllergen,
        false
    );

    assert.deepEqual(
        result.matchedAllergies,
        []
    );

});


// ============================================================
// TEST 5: DETECT CUSTOM ALLERGIES
// ============================================================

test("detects custom allergies supplied by the household", function () {

    const recipe = {
        ingredients: [
            { name: "Dijon mustard" },
            { name: "Chicken" }
        ]
    };

    const result = screenRecipeForAllergies(
        recipe,
        ["mustard"]
    );

    assert.equal(
        result.suitableByDeclaredAllergies,
        false
    );

    assert.deepEqual(
        result.matchedAllergies,
        ["mustard"]
    );

});


// ============================================================
// TEST 6: AVOID PARTIAL WORD MATCHES FOR CUSTOM ALLERGIES
// ============================================================

test("does not match a custom allergy inside an unrelated word", function () {

    const recipe = {
        ingredients: [
            { name: "Coconut" },
            { name: "Rice" }
        ]
    };

    const result = screenRecipeForAllergies(
        recipe,
        ["nut"]
    );

    assert.equal(
        result.suitableByDeclaredAllergies,
        true
    );

});


// ============================================================
// TEST 7: FILTER A COLLECTION OF RECIPES
// ============================================================

test("excludes recipes containing declared allergens", function () {

    const recipes = [
        {
            id: "1",
            name: "Peanut Rice",
            ingredients: ["Peanuts", "Rice"]
        },
        {
            id: "2",
            name: "Chicken Rice",
            ingredients: ["Chicken", "Rice"]
        },
        {
            id: "3",
            name: "Peanut Chicken",
            ingredients: ["Chicken", "Peanut butter"]
        }
    ];

    const result = filterRecipesByAllergies(
        recipes,
        ["Peanuts"]
    );

    assert.equal(result.totalChecked, 3);

    assert.equal(result.totalIncluded, 1);

    assert.equal(result.totalExcluded, 2);

    assert.equal(result.recipes[0].id, "2");

    assert.equal(result.excludedRecipes.length, 2);

});


// ============================================================
// TEST 8: REJECT INVALID RECIPE INPUT
// ============================================================

test("throws an error when an invalid recipe is supplied", function () {

    assert.throws(
        function () {
            screenRecipeForAllergies(null, ["Peanuts"]);
        },
        {
            name: "TypeError"
        }
    );

});


// ============================================================
// TEST 9: REJECT INVALID ALLERGY INPUT
// ============================================================

test("throws an error when selected allergies are not an array", function () {

    const recipe = {
        ingredients: ["Chicken"]
    };

    assert.throws(
        function () {
            screenRecipeForAllergies(recipe, "Peanuts");
        },
        {
            name: "TypeError"
        }
    );

});
