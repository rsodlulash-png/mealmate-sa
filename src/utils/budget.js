// ============================================================
// MEALMATE SA
// Grocery Budget and Cost Calculations
// File: src/utils/budget.js
// ============================================================

"use strict";


// ============================================================
// 1. CURRENCY CONFIGURATION
// ============================================================

const CURRENCY = "ZAR";


// ============================================================
// 2. VALIDATE MONEY VALUES
// ============================================================

function validateMoney(value, fieldName = "Amount") {

    const amount = Number(value);

    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {

        throw new Error(
            `${fieldName} must be a valid amount greater than or equal to zero.`
        );

    }

    return amount;

}


// ============================================================
// 3. VALIDATE WEEKLY BUDGET
// ============================================================

function validateWeeklyBudget(budget) {

    const amount = Number(budget);

    if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 100000
    ) {

        throw new Error(
            "Weekly budget must be between R1 and R100,000."
        );

    }

    return roundMoney(amount);

}


// ============================================================
// 4. ROUND MONEY TO TWO DECIMAL PLACES
// ============================================================

function roundMoney(amount) {

    return Math.round(
        (amount + Number.EPSILON) * 100
    ) / 100;

}


// ============================================================
// 5. GET A VALID ITEM QUANTITY
// ============================================================

function getItemQuantity(item) {

    if (!item || typeof item !== "object") {
        return null;
    }

    const quantity = Number(item.quantity);

    if (
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {
        return null;
    }

    return quantity;

}


// ============================================================
// 6. GET A VALID UNIT PRICE
// ============================================================

// Our shopping list uses unitCost.
//
// Example:
// {
//     name: "Potatoes",
//     quantity: 2,
//     unit: "kg",
//     unitCost: 15
// }
//
// This means R15 per kg.

function getUnitPrice(item) {

    if (!item || typeof item !== "object") {
        return null;
    }

    const value = item.unitCost;

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const price = Number(value);

    if (
        !Number.isFinite(price) ||
        price < 0
    ) {
        return null;
    }

    return price;

}


// ============================================================
// 7. CALCULATE THE COST OF ONE SHOPPING ITEM
// ============================================================

// Formula:
//
// Item cost = Quantity x Unit price
//
// Example:
//
// 2 kg potatoes x R15/kg = R30

function calculateItemCost(item) {

    const quantity = getItemQuantity(item);

    const unitPrice = getUnitPrice(item);


    // Do not pretend that an unavailable price is R0.
    if (
        quantity === null ||
        unitPrice === null
    ) {
        return null;
    }


    return roundMoney(quantity * unitPrice);

}


// ============================================================
// 8. CALCULATE TOTAL COST OF SHOPPING ITEMS
// ============================================================

function calculateItemsCost(items) {

    if (!Array.isArray(items)) {

        throw new Error(
            "Shopping items must be provided as an array."
        );

    }


    let knownSubtotal = 0;

    let unknownPriceCount = 0;

    let pricedItemCount = 0;


    items.forEach(function (item) {

        const cost = calculateItemCost(item);


        if (cost === null) {

            unknownPriceCount++;

        } else {

            knownSubtotal += cost;

            pricedItemCount++;

        }

    });


    knownSubtotal = roundMoney(knownSubtotal);


    return {

        knownSubtotal: knownSubtotal,

        totalItems: items.length,

        pricedItems: pricedItemCount,

        unknownPriceCount: unknownPriceCount,

        // The complete total is only available when
        // every item has a valid price.

        complete: unknownPriceCount === 0,

        totalCost:
            unknownPriceCount === 0
                ? knownSubtotal
                : null

    };

}


// ============================================================
// 9. CALCULATE REMAINING BUDGET
// ============================================================

function calculateRemainingBudget(budget, spending) {

    const weeklyBudget = validateWeeklyBudget(budget);

    const totalSpending = validateMoney(
        spending,
        "Total spending"
    );


    return roundMoney(
        weeklyBudget - totalSpending
    );

}


// ============================================================
// 10. CALCULATE BUDGET USAGE PERCENTAGE
// ============================================================

function calculateBudgetPercentage(budget, spending) {

    const weeklyBudget = validateWeeklyBudget(budget);

    const totalSpending = validateMoney(
        spending,
        "Total spending"
    );


    const percentage = (
        totalSpending / weeklyBudget
    ) * 100;


    return roundMoney(percentage);

}


// ============================================================
// 11. DETERMINE BUDGET STATUS
// ============================================================

function getBudgetStatus(budget, spending) {

    const weeklyBudget = validateWeeklyBudget(budget);

    const totalSpending = validateMoney(
        spending,
        "Total spending"
    );


    if (totalSpending > weeklyBudget) {

        return "over-budget";

    }

    if (totalSpending === weeklyBudget) {

        return "at-budget";

    }

    if (totalSpending >= weeklyBudget * 0.9) {

        return "almost-at-budget";

    }


    return "within-budget";

}


// ============================================================
// 12. CREATE A COMPLETE BUDGET SUMMARY
// ============================================================

function calculateBudgetSummary(budget, items) {

    const weeklyBudget = validateWeeklyBudget(budget);

    const costSummary = calculateItemsCost(items);


    const knownSubtotal = costSummary.knownSubtotal;


    // Calculate remaining budget only when every item's
    // cost is known.
    const remainingBudget = costSummary.complete
        ? calculateRemainingBudget(
            weeklyBudget,
            knownSubtotal
        )
        : null;


    const percentageUsed = costSummary.complete
        ? calculateBudgetPercentage(
            weeklyBudget,
            knownSubtotal
        )
        : null;


    const status = costSummary.complete
        ? getBudgetStatus(
            weeklyBudget,
            knownSubtotal
        )
        : "incomplete-pricing";


    const overBudgetAmount =
        remainingBudget !== null && remainingBudget < 0
            ? Math.abs(remainingBudget)
            : 0;


    return {

        currency: CURRENCY,

        weeklyBudget: weeklyBudget,

        totalItems: costSummary.totalItems,

        pricedItems: costSummary.pricedItems,

        unknownPriceCount:
            costSummary.unknownPriceCount,

        knownSubtotal: knownSubtotal,

        complete: costSummary.complete,

        estimatedTotal:
            costSummary.totalCost,

        remainingBudget: remainingBudget,

        percentageUsed: percentageUsed,

        status: status,

        overBudgetAmount: roundMoney(
            overBudgetAmount
        )

    };

}


// ============================================================
// 13. GROUP SHOPPING COSTS BY CATEGORY
// ============================================================

function calculateCategoryBreakdown(items) {

    if (!Array.isArray(items)) {

        throw new Error(
            "Shopping items must be provided as an array."
        );

    }


    const categories = new Map();


    items.forEach(function (item) {

        const category = (
            typeof item.category === "string" &&
            item.category.trim()
        )
            ? item.category.trim()
            : "Other";


        if (!categories.has(category)) {

            categories.set(category, {

                category: category,

                knownSubtotal: 0,

                itemCount: 0,

                pricedItems: 0,

                unknownPriceCount: 0

            });

        }


        const summary = categories.get(category);

        summary.itemCount++;


        const itemCost = calculateItemCost(item);


        if (itemCost === null) {

            summary.unknownPriceCount++;

        } else {

            summary.knownSubtotal += itemCost;

            summary.pricedItems++;

        }

    });


    return Array.from(categories.values()).map(
        function (category) {

            category.knownSubtotal = roundMoney(
                category.knownSubtotal
            );

            category.complete =
                category.unknownPriceCount === 0;

            category.totalCost = category.complete
                ? category.knownSubtotal
                : null;

            return category;

        }
    );

}


// ============================================================
// 14. CALCULATE ESTIMATED MEAL PLAN COST
// ============================================================

// This function expects each recipe to have an estimatedCost.
//
// We do not invent recipe costs when the API does not
// supply price information.
//
// Example:
//
// [
//     { name: "Vegetable Curry", estimatedCost: 85 },
//     { name: "Chicken Stew", estimatedCost: 120 }
// ]

function calculateMealPlanCost(recipes) {

    if (!Array.isArray(recipes)) {

        throw new Error(
            "Recipes must be provided as an array."
        );

    }


    let totalCost = 0;

    let pricedRecipes = 0;

    let unknownPriceCount = 0;


    recipes.forEach(function (recipe) {

        if (!recipe || typeof recipe !== "object") {

            unknownPriceCount++;

            return;

        }


        const cost = recipe.estimatedCost;


        if (
            cost === null ||
            cost === undefined ||
            cost === ""
        ) {

            unknownPriceCount++;

            return;

        }


        const price = Number(cost);


        if (
            !Number.isFinite(price) ||
            price < 0
        ) {

            unknownPriceCount++;

            return;

        }


        totalCost += price;

        pricedRecipes++;

    });


    totalCost = roundMoney(totalCost);


    return {

        knownSubtotal: totalCost,

        pricedRecipes: pricedRecipes,

        unknownPriceCount: unknownPriceCount,

        complete: unknownPriceCount === 0,

        totalCost:
            unknownPriceCount === 0
                ? totalCost
                : null

    };

}


// ============================================================
// 15. COMPARE MEAL PLAN WITH WEEKLY BUDGET
// ============================================================

function compareMealPlanWithBudget(
    budget,
    recipes
) {

    const weeklyBudget = validateWeeklyBudget(budget);

    const mealCost = calculateMealPlanCost(recipes);


    if (!mealCost.complete) {

        return {

            currency: CURRENCY,

            weeklyBudget: weeklyBudget,

            knownSubtotal: mealCost.knownSubtotal,

            remainingBudget: null,

            percentageUsed: null,

            status: "incomplete-pricing",

            message:
                "Some recipes do not have price information. " +
                "A complete budget comparison is unavailable."

        };

    }


    const remainingBudget = calculateRemainingBudget(
        weeklyBudget,
        mealCost.totalCost
    );


    const percentageUsed = calculateBudgetPercentage(
        weeklyBudget,
        mealCost.totalCost
    );


    const status = getBudgetStatus(
        weeklyBudget,
        mealCost.totalCost
    );


    let message;


    if (status === "over-budget") {

        message =
            `Your meal plan exceeds your weekly budget by ` +
            `${CURRENCY} ${Math.abs(remainingBudget).toFixed(2)}.`;

    } else if (status === "at-budget") {

        message =
            "Your meal plan uses your entire weekly budget.";

    } else {

        message =
            `Your meal plan is within budget. ` +
            `${CURRENCY} ${remainingBudget.toFixed(2)} remains.`;

    }


    return {

        currency: CURRENCY,

        weeklyBudget: weeklyBudget,

        mealPlanCost: mealCost.totalCost,

        remainingBudget: remainingBudget,

        percentageUsed: percentageUsed,

        status: status,

        message: message

    };

}


// ============================================================
// 16. IDENTIFY MEAL OPTIONS WITHIN A BUDGET
// ============================================================

// This function only compares prices supplied with the recipes.
// It does not invent cheaper meals or substitute ingredients.

function findMealsWithinBudget(recipes, budget) {

    if (!Array.isArray(recipes)) {

        throw new Error(
            "Recipes must be provided as an array."
        );

    }


    const maximumBudget = validateWeeklyBudget(budget);


    const affordableMeals = [];

    const overBudgetMeals = [];

    const unpricedMeals = [];


    recipes.forEach(function (recipe) {

        if (
            !recipe ||
            recipe.estimatedCost === null ||
            recipe.estimatedCost === undefined ||
            recipe.estimatedCost === ""
        ) {

            unpricedMeals.push(recipe);

            return;

        }


        const cost = Number(recipe.estimatedCost);


        if (
            !Number.isFinite(cost) ||
            cost < 0
        ) {

            unpricedMeals.push(recipe);

            return;

        }


        if (cost <= maximumBudget) {

            affordableMeals.push(recipe);

        } else {

            overBudgetMeals.push(recipe);

        }

    });


    return {

        budget: maximumBudget,

        affordableMeals: affordableMeals,

        overBudgetMeals: overBudgetMeals,

        unpricedMeals: unpricedMeals

    };

}


// ============================================================
// 17. EXPORT PUBLIC FUNCTIONS
// ============================================================

export {

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

};


// ============================================================
// END OF BUDGET.JS
// ============================================================
