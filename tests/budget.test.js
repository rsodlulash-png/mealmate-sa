// ============================================================
// MEALMATE SA
// Grocery Budget Calculation Tests
// File: tests/budget.test.js
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";

import {
    CURRENCY,
    validateMoney,
    validateWeeklyBudget,
    roundMoney,
    calculateItemCost,
    calculateItemsCost,
    calculateRemainingBudget,
    calculateBudgetPercentage,
    getBudgetStatus,
    calculateBudgetSummary,
    calculateCategoryBreakdown,
    calculateMealPlanCost,
    compareMealPlanWithBudget,
    findMealsWithinBudget
} from "../src/utils/budget.js";


// ============================================================
// TEST 1: CHECK CURRENCY
// ============================================================

test("uses South African Rand as the currency", function () {

    assert.equal(CURRENCY, "ZAR");

});


// ============================================================
// TEST 2: VALIDATE MONEY
// ============================================================

test("accepts valid money amounts", function () {

    assert.equal(validateMoney(150), 150);

    assert.equal(validateMoney(0), 0);

});


// ============================================================
// TEST 3: REJECT INVALID MONEY
// ============================================================

test("rejects negative money amounts", function () {

    assert.throws(
        function () {
            validateMoney(-50);
        },
        /greater than or equal to zero/
    );

});


// ============================================================
// TEST 4: VALIDATE WEEKLY BUDGET
// ============================================================

test("accepts a valid weekly grocery budget", function () {

    assert.equal(validateWeeklyBudget(1500), 1500);

});


// ============================================================
// TEST 5: REJECT INVALID WEEKLY BUDGET
// ============================================================

test("rejects zero and budgets above R100000", function () {

    assert.throws(
        function () {
            validateWeeklyBudget(0);
        },
        /Weekly budget must be between/
    );

    assert.throws(
        function () {
            validateWeeklyBudget(100001);
        },
        /Weekly budget must be between/
    );

});


// ============================================================
// TEST 6: ROUND MONEY
// ============================================================

test("rounds money to two decimal places", function () {

    assert.equal(roundMoney(12.567), 12.57);

    assert.equal(roundMoney(15.124), 15.12);

});


// ============================================================
// TEST 7: CALCULATE ONE SHOPPING ITEM
// ============================================================

test("calculates the cost of a shopping item", function () {

    const potatoes = {
        name: "Potatoes",
        quantity: 2,
        unit: "kg",
        unitCost: 15
    };

    const result = calculateItemCost(potatoes);

    assert.equal(result, 30);

});


// ============================================================
// TEST 8: HANDLE UNAVAILABLE ITEM PRICES
// ============================================================

test("returns null when an item's price is unavailable", function () {

    const item = {
        name: "Rice",
        quantity: 2,
        unit: "kg",
        unitCost: null
    };

    const result = calculateItemCost(item);

    assert.equal(result, null);

});


// ============================================================
// TEST 9: CALCULATE TOTAL SHOPPING COST
// ============================================================

test("calculates the total cost of priced shopping items", function () {

    const items = [
        {
            name: "Potatoes",
            quantity: 2,
            unitCost: 15
        },
        {
            name: "Rice",
            quantity: 1,
            unitCost: 35
        }
    ];

    const result = calculateItemsCost(items);

    assert.equal(result.knownSubtotal, 65);

    assert.equal(result.totalItems, 2);

    assert.equal(result.pricedItems, 2);

    assert.equal(result.unknownPriceCount, 0);

    assert.equal(result.complete, true);

    assert.equal(result.totalCost, 65);

});


// ============================================================
// TEST 10: HANDLE SHOPPING ITEMS WITH UNKNOWN PRICES
// ============================================================

test("does not calculate a complete total when prices are missing", function () {

    const items = [
        {
            name: "Potatoes",
            quantity: 2,
            unitCost: 15
        },
        {
            name: "Milk",
            quantity: 1,
            unitCost: null
        }
    ];

    const result = calculateItemsCost(items);

    assert.equal(result.knownSubtotal, 30);

    assert.equal(result.totalItems, 2);

    assert.equal(result.pricedItems, 1);

    assert.equal(result.unknownPriceCount, 1);

    assert.equal(result.complete, false);

    assert.equal(result.totalCost, null);

});


// ============================================================
// TEST 11: CALCULATE REMAINING BUDGET
// ============================================================

test("calculates the remaining weekly budget", function () {

    const result = calculateRemainingBudget(1500, 400);

    assert.equal(result, 1100);

});


// ============================================================
// TEST 12: CALCULATE BUDGET PERCENTAGE
// ============================================================

test("calculates the percentage of the budget used", function () {

    const result = calculateBudgetPercentage(1000, 250);

    assert.equal(result, 25);

});


// ============================================================
// TEST 13: DETERMINE BUDGET STATUS
// ============================================================

test("identifies whether spending is within the budget", function () {

    assert.equal(
        getBudgetStatus(1000, 500),
        "within-budget"
    );

    assert.equal(
        getBudgetStatus(1000, 900),
        "almost-at-budget"
    );

    assert.equal(
        getBudgetStatus(1000, 1000),
        "at-budget"
    );

    assert.equal(
        getBudgetStatus(1000, 1200),
        "over-budget"
    );

});


// ============================================================
// TEST 14: GENERATE A COMPLETE BUDGET SUMMARY
// ============================================================

test("generates a complete weekly grocery budget summary", function () {

    const items = [
        {
            name: "Rice",
            quantity: 2,
            unitCost: 50
        },
        {
            name: "Milk",
            quantity: 2,
            unitCost: 20
        }
    ];

    const result = calculateBudgetSummary(1000, items);

    assert.equal(result.currency, "ZAR");

    assert.equal(result.weeklyBudget, 1000);

    assert.equal(result.totalItems, 2);

    assert.equal(result.pricedItems, 2);

    assert.equal(result.knownSubtotal, 140);

    assert.equal(result.complete, true);

    assert.equal(result.estimatedTotal, 140);

    assert.equal(result.remainingBudget, 860);

    assert.equal(result.percentageUsed, 14);

    assert.equal(result.status, "within-budget");

});


// ============================================================
// TEST 15: HANDLE INCOMPLETE BUDGET SUMMARIES
// ============================================================

test("does not invent totals when grocery prices are missing", function () {

    const items = [
        {
            name: "Rice",
            quantity: 2,
            unitCost: 50
        },
        {
            name: "Eggs",
            quantity: 1,
            unitCost: null
        }
    ];

    const result = calculateBudgetSummary(1000, items);

    assert.equal(result.complete, false);

    assert.equal(result.knownSubtotal, 100);

    assert.equal(result.estimatedTotal, null);

    assert.equal(result.remainingBudget, null);

    assert.equal(result.percentageUsed, null);

    assert.equal(result.status, "incomplete-pricing");

});


// ============================================================
// TEST 16: GROUP SHOPPING COSTS BY CATEGORY
// ============================================================

test("groups grocery costs into categories", function () {

    const items = [
        {
            name: "Potatoes",
            category: "Vegetables",
            quantity: 2,
            unitCost: 15
        },
        {
            name: "Onions",
            category: "Vegetables",
            quantity: 1,
            unitCost: 10
        },
        {
            name: "Milk",
            category: "Dairy",
            quantity: 2,
            unitCost: 20
        }
    ];

    const result = calculateCategoryBreakdown(items);

    assert.equal(result.length, 2);

    const vegetables = result.find(
        item => item.category === "Vegetables"
    );

    assert.equal(vegetables.itemCount, 2);

    assert.equal(vegetables.knownSubtotal, 40);

    assert.equal(vegetables.complete, true);

});


// ============================================================
// TEST 17: CALCULATE MEAL PLAN COST
// ============================================================

test("calculates the total cost of a priced meal plan", function () {

    const recipes = [
        {
            name: "Chicken Curry",
            estimatedCost: 120
        },
        {
            name: "Vegetable Rice",
            estimatedCost: 80
        }
    ];

    const result = calculateMealPlanCost(recipes);

    assert.equal(result.knownSubtotal, 200);

    assert.equal(result.pricedRecipes, 2);

    assert.equal(result.unknownPriceCount, 0);

    assert.equal(result.complete, true);

    assert.equal(result.totalCost, 200);

});


// ============================================================
// TEST 18: COMPARE MEAL PLAN WITH WEEKLY BUDGET
// ============================================================

test("compares a meal plan with a weekly grocery budget", function () {

    const recipes = [
        {
            name: "Chicken Curry",
            estimatedCost: 200
        },
        {
            name: "Vegetable Rice",
            estimatedCost: 100
        }
    ];

    const result = compareMealPlanWithBudget(
        1000,
        recipes
    );

    assert.equal(result.currency, "ZAR");

    assert.equal(result.weeklyBudget, 1000);

    assert.equal(result.mealPlanCost, 300);

    assert.equal(result.remainingBudget, 700);

    assert.equal(result.percentageUsed, 30);

    assert.equal(result.status, "within-budget");

});


// ============================================================
// TEST 19: HANDLE UNAVAILABLE MEAL PRICES
// ============================================================

test("reports incomplete pricing for unpriced meal plans", function () {

    const recipes = [
        {
            name: "Chicken Curry",
            estimatedCost: 200
        },
        {
            name: "Vegetable Rice",
            estimatedCost: null
        }
    ];

    const result = compareMealPlanWithBudget(
        1000,
        recipes
    );

    assert.equal(result.status, "incomplete-pricing");

    assert.equal(result.remainingBudget, null);

    assert.equal(result.percentageUsed, null);

    assert.equal(result.knownSubtotal, 200);

});


// ============================================================
// TEST 20: FIND AFFORDABLE MEALS
// ============================================================

test("separates affordable meals from over-budget meals", function () {

    const recipes = [
        {
            name: "Rice",
            estimatedCost: 50
        },
        {
            name: "Chicken Curry",
            estimatedCost: 150
        },
        {
            name: "Beef Stew",
            estimatedCost: 250
        },
        {
            name: "Vegetable Soup",
            estimatedCost: null
        }
    ];

    const result = findMealsWithinBudget(recipes, 150);

    assert.equal(result.budget, 150);

    assert.equal(result.affordableMeals.length, 2);

    assert.equal(result.overBudgetMeals.length, 1);

    assert.equal(result.unpricedMeals.length, 1);

    assert.equal(result.affordableMeals[0].name, "Rice");

    assert.equal(
        result.overBudgetMeals[0].name,
        "Beef Stew"
    );

});
