
// ============================================================
// MEALMATE SA
// Backend Validation Tests
// File: tests/validators.test.js
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";

import {
    ValidationError,
    DIETARY_PREFERENCES,
    CHILD_AGE_GROUPS,
    MEAL_TYPES,
    DAYS_OF_WEEK,
    APPLIANCES,
    COOKING_STYLES,
    validateObject,
    validateString,
    validateNumber,
    validateEnum,
    validateStringArray,
    validateWeeklyBudget,
    validateRecipeSearchQuery,
    validateRecipeId,
    validateHouseholdPreferences,
    validatePantryItem,
    validateShoppingItem,
    validateRecipeFilters,
    validateMealPlanRequest,
    validateGroceryPriceRequest,
    validateNutritionRequest
} from "../src/utils/validators.js";


// ============================================================
// TEST HELPERS
// ============================================================

function createHousehold(overrides = {}) {

    return {
        retailer: "Checkers",
        shoppingLocation: "Johannesburg",

        adultCount: 2,
        childCount: 0,

        childAgeGroups: [],

        childrenByAgeGroup: {
            "0-2 years": 0,
            "3-5 years": 0,
            "6-12 years": 0,
            "13-17 years": 0
        },

        childPortionFactors: {},

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

        ...overrides
    };

}


// A valid household containing three children.
function createHouseholdWithChildren(overrides = {}) {

    return createHousehold({

        adultCount: 2,
        childCount: 3,

        childAgeGroups: [
            "3-5 years",
            "6-12 years"
        ],

        childrenByAgeGroup: {
            "0-2 years": 0,
            "3-5 years": 1,
            "6-12 years": 2,
            "13-17 years": 0
        },

        childPortionFactors: {
            "3-5 years": 0.5,
            "6-12 years": 0.75
        },

        ...overrides

    });

}


// ============================================================
// 1. CONFIGURATION TESTS
// ============================================================

test("contains the supported dietary preferences", function () {

    assert.deepEqual(
        DIETARY_PREFERENCES,
        ["No restrictions", "Halaal", "Vegetarian", "Vegan"]
    );

});


test("contains the supported child age groups", function () {

    assert.equal(CHILD_AGE_GROUPS.length, 4);

    assert.ok(CHILD_AGE_GROUPS.includes("3-5 years"));

});


test("contains the three supported meal types", function () {

    assert.deepEqual(
        MEAL_TYPES,
        ["Breakfast", "Lunch", "Dinner"]
    );

});


test("contains all seven days of the week", function () {

    assert.equal(DAYS_OF_WEEK.length, 7);

    assert.ok(DAYS_OF_WEEK.includes("Sunday"));

});


test("contains supported kitchen appliances and cooking styles", function () {

    assert.ok(APPLIANCES.includes("Stove"));

    assert.ok(APPLIANCES.includes("Air fryer"));

    assert.ok(COOKING_STYLES.includes("Budget-friendly"));

    assert.ok(COOKING_STYLES.includes("Batch cooking"));

});


// ============================================================
// 2. VALIDATION ERROR TESTS
// ============================================================

test("ValidationError has the correct name and HTTP status", function () {

    const error = new ValidationError("Invalid information.");

    assert.equal(error.name, "ValidationError");

    assert.equal(error.status, 400);

    assert.equal(error.message, "Invalid information.");

    assert.deepEqual(error.errors, []);

});


// ============================================================
// 3. OBJECT VALIDATION TESTS
// ============================================================

test("accepts a valid object", function () {

    const input = {
        name: "MealMate",
        version: 1
    };

    const result = validateObject(input);

    assert.deepEqual(result, input);

});


test("rejects null, arrays and non-object values", function () {

    assert.throws(
        () => validateObject(null),
        /valid object/
    );

    assert.throws(
        () => validateObject(["rice"]),
        /valid object/
    );

    assert.throws(
        () => validateObject("MealMate"),
        /valid object/
    );

});


// ============================================================
// 4. STRING VALIDATION TESTS
// ============================================================

test("trims unnecessary spaces from strings", function () {

    const result = validateString(
        "  Checkers  ",
        "Retailer"
    );

    assert.equal(result, "Checkers");

});


test("rejects missing required strings", function () {

    assert.throws(
        () => validateString(
            undefined,
            "Retailer"
        ),
        /is required/
    );

});


test("rejects non-string values", function () {

    assert.throws(
        () => validateString(
            123,
            "Retailer"
        ),
        /must be text/
    );

});


test("allows an empty optional string", function () {

    const result = validateString(
        "   ",
        "Search term",
        {
            required: false
        }
    );

    assert.equal(result, "");

});


test("rejects strings exceeding their maximum length", function () {

    assert.throws(
        () => validateString(
            "a".repeat(81),
            "Retailer",
            {
                maxLength: 80
            }
        ),
        /must not exceed 80 characters/
    );

});


test("rejects strings that do not match a pattern", function () {

    assert.throws(
        () => validateString(
            "Invalid123",
            "Category",
            {
                pattern: /^[a-zA-Z]+$/
            }
        ),
        /invalid characters/
    );

});


// ============================================================
// 5. NUMBER VALIDATION TESTS
// ============================================================

test("accepts valid numeric values", function () {

    assert.equal(
        validateNumber(25, "Age"),
        25
    );

});


test("converts valid numeric strings into numbers", function () {

    assert.equal(
        validateNumber("25", "Age"),
        25
    );

});


test("rejects non-numeric values", function () {

    assert.throws(
        () => validateNumber(
            "invalid",
            "Age"
        ),
        /valid number/
    );

});


test("rejects decimal numbers when integers are required", function () {

    assert.throws(
        () => validateNumber(
            2.5,
            "Adult count",
            {
                integer: true
            }
        ),
        /whole number/
    );

});


test("rejects values outside the permitted range", function () {

    assert.throws(
        () => validateNumber(
            31,
            "Adult count",
            {
                min: 1,
                max: 30
            }
        ),
        /must be between 1 and 30/
    );

});


// ============================================================
// 6. ENUM VALIDATION TESTS
// ============================================================

test("accepts valid dietary preferences", function () {

    assert.equal(
        validateEnum(
            "Vegan",
            DIETARY_PREFERENCES,
            "Diet"
        ),
        "Vegan"
    );

});


test("rejects unsupported dietary preferences", function () {

    assert.throws(
        () => validateEnum(
            "Keto",
            DIETARY_PREFERENCES,
            "Diet"
        ),
        /Diet must be one of/
    );

});


// ============================================================
// 7. STRING ARRAY VALIDATION TESTS
// ============================================================

test("trims string array entries and removes duplicates", function () {

    const result = validateStringArray(
        [" Rice ", "Milk", "Rice"],
        "Ingredients"
    );

    assert.deepEqual(
        result,
        ["Rice", "Milk"]
    );

});


test("rejects invalid array entries", function () {

    assert.throws(
        () => validateStringArray(
            ["Rice", 123],
            "Ingredients"
        ),
        /invalid entry/
    );

});


test("rejects entries outside an allowed selection list", function () {

    assert.throws(
        () => validateStringArray(
            ["Wrong day"],
            "Days",
            {
                allowedValues: DAYS_OF_WEEK
            }
        ),
        /not a valid Days selection/
    );

});


test("rejects arrays exceeding their maximum size", function () {

    assert.throws(
        () => validateStringArray(
            Array.from(
                { length: 8 },
                (_, index) => `Item ${index}`
            ),
            "Items",
            {
                maxItems: 7
            }
        ),
        /must not contain more than 7 items/
    );

});


// ============================================================
// 8. WEEKLY BUDGET VALIDATION TESTS
// ============================================================

test("accepts a valid weekly grocery budget", function () {

    assert.equal(
        validateWeeklyBudget(1500),
        1500
    );

});


test("rejects zero and negative weekly budgets", function () {

    assert.throws(
        () => validateWeeklyBudget(0),
        /Weekly grocery budget/
    );

    assert.throws(
        () => validateWeeklyBudget(-100),
        /Weekly grocery budget/
    );

});


test("rejects weekly budgets above R100000", function () {

    assert.throws(
        () => validateWeeklyBudget(100001),
        /must be between/
    );

});


// ============================================================
// 9. RECIPE SEARCH VALIDATION TESTS
// ============================================================

test("provides default recipe search values", function () {

    const result = validateRecipeSearchQuery({});

    assert.deepEqual(result, {
        search: "",
        category: "",
        sort: "default",
        diet: "all",
        maxTime: "all"
    });

});


test("normalises valid recipe search input", function () {

    const result = validateRecipeSearchQuery({
        search: " chicken ",
        category: "Chicken",
        sort: "name-asc",
        diet: "Vegetarian",
        maxTime: 45
    });

    assert.deepEqual(result, {
        search: "chicken",
        category: "Chicken",
        sort: "name-asc",
        diet: "Vegetarian",
        maxTime: 45
    });

});


test("rejects unsupported recipe sorting options", function () {

    assert.throws(
        () => validateRecipeSearchQuery({
            sort: "random"
        }),
        /Recipe sort option/
    );

});


test("rejects invalid recipe search time limits", function () {

    assert.throws(
        () => validateRecipeSearchQuery({
            maxTime: 700
        }),
        /Maximum cooking time/
    );

});


// ============================================================
// 10. RECIPE ID VALIDATION TESTS
// ============================================================

test("accepts numeric recipe IDs", function () {

    assert.equal(
        validateRecipeId("52772"),
        "52772"
    );

    assert.equal(
        validateRecipeId(52772),
        "52772"
    );

});


test("rejects recipe IDs containing letters", function () {

    assert.throws(
        () => validateRecipeId("ABC52772"),
        /only numbers/
    );

});


test("rejects excessively long recipe IDs", function () {

    assert.throws(
        () => validateRecipeId("1".repeat(21)),
        /only numbers/
    );

});


// ============================================================
// 11. HOUSEHOLD PREFERENCE VALIDATION TESTS
// ============================================================

test("accepts valid household preferences", function () {

    const result = validateHouseholdPreferences(
        createHousehold()
    );

    assert.equal(result.retailer, "Checkers");

    assert.equal(result.adultCount, 2);

    assert.equal(result.childCount, 0);

    assert.equal(result.totalHouseholdMembers, 2);

    assert.equal(result.diet, "No restrictions");

    assert.equal(result.weeklyBudget, 1500);

    assert.equal(result.budgetScope, "all-meals");

    assert.deepEqual(
        result.childrenByAgeGroup,
        {
            "0-2 years": 0,
            "3-5 years": 0,
            "6-12 years": 0,
            "13-17 years": 0
        }
    );

    assert.deepEqual(result.childPortionFactors, {});

    assert.equal(result.adultPortionFactor, 1);

});


test("rejects household preferences without selected days", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({
                days: []
            })
        ),
        error => {

            assert.ok(error instanceof ValidationError);

            assert.ok(
                error.errors.some(
                    message => message.includes(
                        "at least one day"
                    )
                )
            );

            return true;

        }
    );

});


test("rejects household preferences without selected meal types", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({
                mealTypes: []
            })
        ),
        error => {

            assert.ok(error instanceof ValidationError);

            assert.ok(
                error.errors.some(
                    message => message.includes(
                        "at least one meal type"
                    )
                )
            );

            return true;

        }
    );

});


// ------------------------------------------------------------
// 11.1 CHILD AGE-GROUP COUNT TESTS
// ------------------------------------------------------------

test("calculates total household members using child age-group counts", function () {

    const result = validateHouseholdPreferences(
        createHouseholdWithChildren()
    );

    assert.equal(result.adultCount, 2);

    assert.equal(result.childCount, 3);

    assert.equal(result.totalHouseholdMembers, 5);

    assert.deepEqual(
        result.childAgeGroups,
        ["3-5 years", "6-12 years"]
    );

    assert.deepEqual(
        result.childrenByAgeGroup,
        {
            "0-2 years": 0,
            "3-5 years": 1,
            "6-12 years": 2,
            "13-17 years": 0
        }
    );

});


test("returns the configured child portion factors", function () {

    const result = validateHouseholdPreferences(
        createHouseholdWithChildren()
    );

    assert.deepEqual(
        result.childPortionFactors,
        {
            "3-5 years": 0.5,
            "6-12 years": 0.75
        }
    );

});


test("normalises numeric-string child counts and portion factors", function () {

    const result = validateHouseholdPreferences(
        createHouseholdWithChildren({

            childCount: 2,

            childAgeGroups: ["6-12 years"],

            childrenByAgeGroup: {
                "0-2 years": "0",
                "3-5 years": "0",
                "6-12 years": "2",
                "13-17 years": "0"
            },

            childPortionFactors: {
                "6-12 years": "0.75"
            }

        })
    );

    assert.equal(
        result.childrenByAgeGroup["6-12 years"],
        2
    );

    assert.equal(
        result.childPortionFactors["6-12 years"],
        0.75
    );

});


test("rejects children without an age-group breakdown", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({

                childCount: 2,

                childAgeGroups: ["3-5 years"],

                childrenByAgeGroup: undefined

            })
        ),
        error => {

            assert.ok(error instanceof ValidationError);

            assert.ok(
                error.errors.some(
                    message => message.includes(
                        "number of children in each age group"
                    )
                )
            );

            return true;

        }
    );

});


test("rejects children without selected age groups", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({
                childCount: 2,
                childAgeGroups: []
            })
        ),
        error => {

            assert.ok(error instanceof ValidationError);

            assert.ok(
                error.errors.some(
                    message => message.includes(
                        "at least one age group for the children"
                    )
                )
            );

            return true;

        }
    );

});


test("rejects age-group counts that do not equal the total child count", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({

                childCount: 3,

                childAgeGroups: ["3-5 years"],

                childrenByAgeGroup: {
                    "0-2 years": 0,
                    "3-5 years": 1,
                    "6-12 years": 0,
                    "13-17 years": 0
                },

                childPortionFactors: {
                    "3-5 years": 0.5
                }

            })
        ),
        error => {

            assert.ok(error instanceof ValidationError);

            assert.ok(
                error.errors.some(
                    message => message.includes(
                        "must equal the total number of children"
                    )
                )
            );

            return true;

        }
    );

});


test("rejects fractional child age-group counts", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({

                childCount: 1,

                childAgeGroups: ["3-5 years"],

                childrenByAgeGroup: {
                    "0-2 years": 0,
                    "3-5 years": 1.5,
                    "6-12 years": 0,
                    "13-17 years": 0
                },

                childPortionFactors: {
                    "3-5 years": 0.5
                }

            })
        ),
        error => {

            assert.ok(error instanceof ValidationError);

            assert.ok(
                error.errors.some(
                    message => message.includes(
                        "whole number"
                    )
                )
            );

            return true;

        }
    );

});


test("rejects child age-group counts above 30", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({

                childCount: 30,

                childrenByAgeGroup: {
                    "0-2 years": 0,
                    "3-5 years": 31,
                    "6-12 years": 0,
                    "13-17 years": 0
                },

                childAgeGroups: ["3-5 years"],

                childPortionFactors: {
                    "3-5 years": 0.5
                }

            })
        ),
        /invalid information/
    );

});


test("rejects unsupported child age-group names", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({

                childCount: 1,

                childAgeGroups: ["3-5 years"],

                childrenByAgeGroup: {
                    "3-5 years": 1,
                    "20-25 years": 0
                },

                childPortionFactors: {
                    "3-5 years": 0.5
                }

            })
        ),
        error => {

            assert.ok(error instanceof ValidationError);

            assert.ok(
                error.errors.some(
                    message => message.includes(
                        "Unsupported child age group"
                    )
                )
            );

            return true;

        }
    );

});


test("rejects selected child age groups that contradict their counts", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({

                childCount: 1,

                childAgeGroups: ["6-12 years"],

                childrenByAgeGroup: {
                    "0-2 years": 0,
                    "3-5 years": 1,
                    "6-12 years": 0,
                    "13-17 years": 0
                },

                childPortionFactors: {
                    "3-5 years": 0.5
                }

            })
        ),
        error => {

            assert.ok(error instanceof ValidationError);

            assert.ok(
                error.errors.some(
                    message => message.includes(
                        "must match the age-group child counts"
                    )
                )
            );

            return true;

        }
    );

});


// ------------------------------------------------------------
// 11.2 CHILD PORTION FACTOR TESTS
// ------------------------------------------------------------

test("requires a portion factor for every age group containing children", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({

                childCount: 3,

                childAgeGroups: [
                    "3-5 years",
                    "6-12 years"
                ],

                childrenByAgeGroup: {
                    "0-2 years": 0,
                    "3-5 years": 1,
                    "6-12 years": 2,
                    "13-17 years": 0
                },

                childPortionFactors: {
                    "3-5 years": 0.5
                }

            })
        ),
        error => {

            assert.ok(error instanceof ValidationError);

            assert.ok(
                error.errors.some(
                    message => message.includes(
                        "portion factor for children aged 6-12 years"
                    )
                )
            );

            return true;

        }
    );

});


test("rejects zero child portion factors", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHouseholdWithChildren({

                childPortionFactors: {
                    "3-5 years": 0,
                    "6-12 years": 0.75
                }

            })
        ),
        error => {

            assert.ok(error instanceof ValidationError);

            assert.ok(
                error.errors.some(
                    message => message.includes(
                        "must be greater than zero"
                    )
                )
            );

            return true;

        }
    );

});


test("rejects negative child portion factors", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHouseholdWithChildren({

                childPortionFactors: {
                    "3-5 years": -0.5,
                    "6-12 years": 0.75
                }

            })
        ),
        /invalid information/
    );

});


test("rejects child portion factors above the permitted maximum", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHouseholdWithChildren({

                childPortionFactors: {
                    "3-5 years": 0.5,
                    "6-12 years": 11
                }

            })
        ),
        /invalid information/
    );

});


test("rejects unsupported child portion-factor age groups", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({

                childCount: 1,

                childAgeGroups: ["3-5 years"],

                childrenByAgeGroup: {
                    "0-2 years": 0,
                    "3-5 years": 1,
                    "6-12 years": 0,
                    "13-17 years": 0
                },

                childPortionFactors: {
                    "3-5 years": 0.5,
                    "20-25 years": 0.75
                }

            })
        ),
        error => {

            assert.ok(error instanceof ValidationError);

            assert.ok(
                error.errors.some(
                    message => message.includes(
                        "Unsupported child portion-factor age group"
                    )
                )
            );

            return true;

        }
    );

});


test("applies the default adult portion factor", function () {

    const result = validateHouseholdPreferences(
        createHousehold()
    );

    assert.equal(result.adultPortionFactor, 1);

});


test("accepts a custom adult portion factor", function () {

    const result = validateHouseholdPreferences(
        createHousehold({
            adultPortionFactor: 1.25
        })
    );

    assert.equal(result.adultPortionFactor, 1.25);

});


test("rejects an invalid adult portion factor", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({
                adultPortionFactor: 0
            })
        ),
        /invalid information/
    );

});


// ------------------------------------------------------------
// 11.3 OTHER HOUSEHOLD VALIDATION TESTS
// ------------------------------------------------------------

test("rejects invalid household preferences", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({
                adultCount: 0,
                diet: "Keto",
                weeklyBudget: 0,
                budgetScope: "monthly"
            })
        ),
        error => {

            assert.ok(error instanceof ValidationError);

            assert.ok(error.errors.length >= 4);

            return true;

        }
    );

});


test("validates calorie targets for adults", function () {

    const result = validateHouseholdPreferences(
        createHousehold({
            calorieGoalType: "per-adult",
            calorieTarget: 2000
        })
    );

    assert.equal(result.calorieGoalType, "per-adult");

    assert.equal(result.calorieTarget, 2000);

});


test("rejects an invalid adult calorie target", function () {

    assert.throws(
        () => validateHouseholdPreferences(
            createHousehold({
                calorieGoalType: "per-adult",
                calorieTarget: 200
            })
        ),
        /invalid information/
    );

});


test("accepts a valid maximum cooking time", function () {

    const result = validateHouseholdPreferences(
        createHousehold({
            maxCookingTime: 45
        })
    );

    assert.equal(result.maxCookingTime, 45);

});


// ============================================================
// 12. PANTRY ITEM VALIDATION TESTS
// ============================================================

test("validates and normalises a pantry item", function () {

    const result = validatePantryItem({
        name: " Rice ",
        quantity: 5
    });

    assert.deepEqual(result, {
        id: null,
        name: "Rice",
        quantity: 5,
        unit: "each"
    });

});


test("rejects pantry items with invalid quantities", function () {

    assert.throws(
        () => validatePantryItem({
            name: "Rice",
            quantity: 0
        }),
        /must be between/
    );

});


// ============================================================
// 13. SHOPPING ITEM VALIDATION TESTS
// ============================================================

test("validates a complete shopping item", function () {

    const result = validateShoppingItem({
        name: "Potatoes",
        quantity: 2,
        unit: "kg",
        category: "Vegetables",
        unitCost: 15,
        purchased: true
    });

    assert.equal(result.name, "Potatoes");

    assert.equal(result.quantity, 2);

    assert.equal(result.unit, "kg");

    assert.equal(result.category, "Vegetables");

    assert.equal(result.unitCost, 15);

    assert.equal(result.purchased, true);

});


test("applies default category and purchased status", function () {

    const result = validateShoppingItem({
        name: "Rice",
        quantity: 2,
        unit: "kg"
    });

    assert.equal(result.category, "Other");

    assert.equal(result.unitCost, null);

    assert.equal(result.purchased, false);

});


test("rejects invalid shopping units", function () {

    assert.throws(
        () => validateShoppingItem({
            name: "Rice",
            quantity: 2,
            unit: "bucket"
        }),
        /Shopping item unit/
    );

});


test("rejects non-boolean shopping purchased status", function () {

    assert.throws(
        () => validateShoppingItem({
            name: "Rice",
            quantity: 2,
            unit: "kg",
            purchased: "false"
        }),
        /purchased status must be true or false/
    );

});


// ============================================================
// 14. RECIPE FILTER VALIDATION TESTS
// ============================================================

test("uses the recipe search validation rules for filters", function () {

    const result = validateRecipeFilters({
        search: "rice",
        category: "Vegetarian"
    });

    assert.equal(result.search, "rice");

    assert.equal(result.category, "Vegetarian");

    assert.equal(result.sort, "default");

});


// ============================================================
// 15. MEAL PLAN REQUEST VALIDATION TESTS
// ============================================================

test("validates and extracts household preferences from a meal plan request", function () {

    const result = validateMealPlanRequest({
        preferences: createHousehold()
    });

    assert.equal(
        result.preferences.retailer,
        "Checkers"
    );

    assert.equal(
        result.preferences.totalHouseholdMembers,
        2
    );

    assert.deepEqual(
        result.preferences.childrenByAgeGroup,
        {
            "0-2 years": 0,
            "3-5 years": 0,
            "6-12 years": 0,
            "13-17 years": 0
        }
    );

});


test("preserves child portion information in a meal plan request", function () {

    const result = validateMealPlanRequest({

        preferences: createHouseholdWithChildren()

    });

    assert.equal(
        result.preferences.childCount,
        3
    );

    assert.equal(
        result.preferences.childrenByAgeGroup["6-12 years"],
        2
    );

    assert.equal(
        result.preferences.childPortionFactors["6-12 years"],
        0.75
    );

});


test("rejects meal plan requests without preferences", function () {

    assert.throws(
        () => validateMealPlanRequest({}),
        /Household preferences/
    );

});


// ============================================================
// 16. GROCERY PRICE REQUEST VALIDATION TESTS
// ============================================================

test("accepts grocery price requests containing item names", function () {

    const result = validateGroceryPriceRequest({
        items: ["rice", "eggs", "milk"],
        retailer: "Checkers"
    });

    assert.deepEqual(
        result.items,
        ["rice", "eggs", "milk"]
    );

    assert.equal(result.retailer, "Checkers");

});


test("accepts structured grocery price request items", function () {

    const result = validateGroceryPriceRequest({
        items: [
            {
                name: "Milk",
                quantity: 2,
                unit: "L",
                category: "Dairy and Eggs"
            }
        ]
    });

    assert.equal(result.items.length, 1);

    assert.equal(result.items[0].name, "Milk");

    assert.equal(result.items[0].quantity, 2);

});


test("rejects empty grocery price requests", function () {

    assert.throws(
        () => validateGroceryPriceRequest({
            items: []
        }),
        /between 1 and 50/
    );

});


test("rejects grocery price requests with more than 50 items", function () {

    assert.throws(
        () => validateGroceryPriceRequest({
            items: Array(51).fill("rice")
        }),
        /between 1 and 50/
    );

});


// ============================================================
// 17. NUTRITION REQUEST VALIDATION TESTS
// ============================================================

test("validates and cleans nutrition ingredient names", function () {

    const result = validateNutritionRequest({
        ingredients: [
            " Rice ",
            "Chicken",
            "Rice"
        ]
    });

    assert.deepEqual(
        result.ingredients,
        ["Rice", "Chicken"]
    );

});


test("rejects nutrition requests with no ingredients", function () {

    assert.throws(
        () => validateNutritionRequest({
            ingredients: []
        }),
        /At least one ingredient is required/
    );

});


test("rejects nutrition ingredient lists exceeding 100 entries", function () {

    assert.throws(
        () => validateNutritionRequest({
            ingredients: Array(101).fill("Rice")
        }),
        /must not contain more than 100/
    );

});


// ============================================================
// END OF VALIDATION TESTS
// ============================================================
