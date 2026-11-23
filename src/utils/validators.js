// ============================================================
// MEALMATE SA
// Backend Input Validation
// File: src/utils/validators.js
// ============================================================

"use strict";


// ============================================================
// 1. VALIDATION CONFIGURATION
// ============================================================

const DIETARY_PREFERENCES = [
    "No restrictions",
    "Halaal",
    "Vegetarian",
    "Vegan"
];

const CHILD_AGE_GROUPS = [
    "0-2 years",
    "3-5 years",
    "6-12 years",
    "13-17 years"
];

const MEAL_TYPES = [
    "Breakfast",
    "Lunch",
    "Dinner"
];

const DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];

const APPLIANCES = [
    "Stove",
    "Oven",
    "Air fryer",
    "Microwave",
    "Slow cooker",
    "Pressure cooker",
    "Rice cooker",
    "Blender",
    "Sandwich maker"
];

const COOKING_STYLES = [
    "Budget-friendly",
    "Quick meals",
    "Traditional South African",
    "One-pot meals",
    "Batch cooking",
    "Healthy and balanced",
    "Family-friendly",
    "Leftover-friendly",
    "Minimal preparation"
];

const GROCERY_CATEGORIES = [
    "Vegetables",
    "Fruits",
    "Meat and Poultry",
    "Fish and Seafood",
    "Dairy and Eggs",
    "Grains and Bakery",
    "Pantry",
    "Other"
];

const GROCERY_UNITS = [
    "each",
    "kg",
    "g",
    "L",
    "ml",
    "pack",
    "bag",
    "bunch",
    "dozen"
];


// ============================================================
// 2. CUSTOM VALIDATION ERROR
// ============================================================

class ValidationError extends Error {

    constructor(message, errors = []) {

        super(message);

        this.name = "ValidationError";

        this.status = 400;

        this.errors = errors;

    }

}


// ============================================================
// 3. GENERAL VALIDATION HELPERS
// ============================================================

function isPlainObject(value) {

    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

}


function validateObject(value, fieldName = "Input") {

    if (!isPlainObject(value)) {

        throw new ValidationError(
            `${fieldName} must be a valid object.`
        );

    }

    return value;

}


function validateString(
    value,
    fieldName,
    options = {}
) {

    const {
        required = true,
        minLength = 1,
        maxLength = 100,
        pattern = null
    } = options;


    if (
        value === undefined ||
        value === null
    ) {

        if (required) {
            throw new ValidationError(`${fieldName} is required.`);
        }

        return "";

    }


    if (typeof value !== "string") {

        throw new ValidationError(
            `${fieldName} must be text.`
        );

    }


    const cleanedValue = value.trim();


    if (!required && cleanedValue === "") {
        return "";
    }


    if (required && cleanedValue.length < minLength) {

        throw new ValidationError(
            `${fieldName} must contain at least ${minLength} characters.`
        );

    }


    if (cleanedValue.length > maxLength) {

        throw new ValidationError(
            `${fieldName} must not exceed ${maxLength} characters.`
        );

    }


    if (pattern && !pattern.test(cleanedValue)) {

        throw new ValidationError(
            `${fieldName} contains invalid characters.`
        );

    }


    return cleanedValue;

}


function validateNumber(
    value,
    fieldName,
    options = {}
) {

    const {
        min = 0,
        max = Number.MAX_SAFE_INTEGER,
        integer = false
    } = options;


    const number = Number(value);


    if (
        value === "" ||
        value === null ||
        value === undefined ||
        !Number.isFinite(number)
    ) {

        throw new ValidationError(
            `${fieldName} must be a valid number.`
        );

    }


    if (integer && !Number.isInteger(number)) {

        throw new ValidationError(
            `${fieldName} must be a whole number.`
        );

    }


    if (number < min || number > max) {

        throw new ValidationError(
            `${fieldName} must be between ${min} and ${max}.`
        );

    }


    return number;

}


function validateEnum(value, allowedValues, fieldName) {

    if (
        typeof value !== "string" ||
        !allowedValues.includes(value)
    ) {

        throw new ValidationError(
            `${fieldName} must be one of: ${allowedValues.join(", ")}.`
        );

    }


    return value;

}


function validateStringArray(
    value,
    fieldName,
    options = {}
) {

    const {
        allowedValues = null,
        required = false,
        maxItems = 50,
        maxItemLength = 100
    } = options;


    if (value === undefined || value === null) {

        if (required) {

            throw new ValidationError(
                `${fieldName} must be provided.`
            );

        }

        return [];

    }


    if (!Array.isArray(value)) {

        throw new ValidationError(
            `${fieldName} must be an array.`
        );

    }


    if (value.length > maxItems) {

        throw new ValidationError(
            `${fieldName} must not contain more than ${maxItems} items.`
        );

    }


    const cleanedValues = value.map(function (item) {

        if (
            typeof item !== "string" ||
            !item.trim()
        ) {

            throw new ValidationError(
                `${fieldName} contains an invalid entry.`
            );

        }


        const cleanedItem = item.trim();


        if (cleanedItem.length > maxItemLength) {

            throw new ValidationError(
                `An entry in ${fieldName} is too long.`
            );

        }


        if (
            allowedValues &&
            !allowedValues.includes(cleanedItem)
        ) {

            throw new ValidationError(
                `"${cleanedItem}" is not a valid ${fieldName} selection.`
            );

        }


        return cleanedItem;

    });


    // Remove duplicate values.
    return [...new Set(cleanedValues)];

}


// ============================================================
// 4. VALIDATE WEEKLY GROCERY BUDGET
// ============================================================

function validateWeeklyBudget(budget) {

    return validateNumber(
        budget,
        "Weekly grocery budget",
        {
            min: 1,
            max: 100000
        }
    );

}


// ============================================================
// 5. VALIDATE RECIPE SEARCH
// ============================================================

function validateRecipeSearchQuery(query) {

    validateObject(query, "Recipe search query");


    const search = query.search === undefined
        ? ""
        : validateString(
            query.search,
            "Search term",
            {
                required: false,
                maxLength: 80
            }
        );


    const category = query.category === undefined ||
        query.category === "" ||
        query.category === "all"
        ? ""
        : validateString(
            query.category,
            "Recipe category",
            {
                maxLength: 40,
                pattern: /^[a-zA-Z][a-zA-Z\s-]*$/
            }
        );


    const sortOptions = [
        "default",
        "name-asc",
        "time-asc",
        "cost-asc",
        "cost-desc"
    ];


    const sort = query.sort === undefined
        ? "default"
        : validateEnum(
            query.sort,
            sortOptions,
            "Recipe sort option"
        );


    const dietOptions = [
        "all",
        ...DIETARY_PREFERENCES
    ];


    const diet = query.diet === undefined
        ? "all"
        : validateEnum(
            query.diet,
            dietOptions,
            "Dietary preference"
        );


    let maxTime = "all";


    if (
        query.maxTime !== undefined &&
        query.maxTime !== "" &&
        query.maxTime !== "all"
    ) {

        maxTime = validateNumber(
            query.maxTime,
            "Maximum cooking time",
            {
                min: 1,
                max: 600,
                integer: true
            }
        );

    }


    return {

        search: search,

        category: category,

        sort: sort,

        diet: diet,

        maxTime: maxTime

    };

}


// ============================================================
// 6. VALIDATE RECIPE ID
// ============================================================

function validateRecipeId(recipeId) {

    if (
        typeof recipeId !== "string" &&
        typeof recipeId !== "number"
    ) {

        throw new ValidationError(
            "Recipe ID must be provided."
        );

    }


    const cleanedId = String(recipeId).trim();


    if (
        !/^\d+$/.test(cleanedId) ||
        cleanedId.length > 20
    ) {

        throw new ValidationError(
            "Recipe ID must contain only numbers."
        );

    }


    return cleanedId;

}


// ============================================================
// 7. VALIDATE HOUSEHOLD PREFERENCES
// ============================================================

function validateHouseholdPreferences(input) {

    validateObject(
        input,
        "Household preferences"
    );


    const errors = [];


    function check(callback) {

        try {

            return callback();

        } catch (error) {

            if (error instanceof ValidationError) {

                errors.push(error.message);

                return null;

            }

            throw error;

        }

    }


    // --------------------------------------------------------
    // A. Shopping information
    // --------------------------------------------------------

    const retailer = check(function () {

        return validateString(
            input.retailer,
            "Preferred supermarket",
            {
                maxLength: 80
            }
        );

    });


    const shoppingLocation = check(function () {

        return validateString(
            input.shoppingLocation,
            "Shopping location",
            {
                maxLength: 120
            }
        );

    });


    // --------------------------------------------------------
    // B. Household size
    // --------------------------------------------------------

    const adultCount = check(function () {

        return validateNumber(
            input.adultCount,
            "Number of adults",
            {
                min: 1,
                max: 30,
                integer: true
            }
        );

    });


    const childCount = check(function () {

        return validateNumber(
            input.childCount ?? 0,
            "Number of children",
            {
                min: 0,
                max: 30,
                integer: true
            }
        );

    });


    // --------------------------------------------------------
    // C. Children's age groups
    // --------------------------------------------------------

    const childAgeGroups = check(function () {

        return validateStringArray(
            input.childAgeGroups || [],
            "Children's age groups",
            {
                allowedValues: CHILD_AGE_GROUPS,
                maxItems: 4
            }
        );

    }) || [];


    if (
        childCount !== null &&
        childCount > 0 &&
        childAgeGroups.length === 0
    ) {

        errors.push(
            "Please select at least one age group for the children."
        );

    }


    // --------------------------------------------------------
    // D. Weekly schedule
    // --------------------------------------------------------

    const days = check(function () {

        return validateStringArray(
            input.days || [],
            "Shopping and meal-planning days",
            {
                allowedValues: DAYS_OF_WEEK,
                required: true,
                maxItems: 7
            }
        );

    }) || [];


    const mealTypes = check(function () {

        return validateStringArray(
            input.mealTypes || [],
            "Meal types",
            {
                allowedValues: MEAL_TYPES,
                required: true,
                maxItems: 3
            }
        );

    }) || [];


    // --------------------------------------------------------
    // E. Kitchen appliances
    // --------------------------------------------------------

    const appliances = check(function () {

        return validateStringArray(
            input.appliances || [],
            "Kitchen appliances",
            {
                allowedValues: APPLIANCES,
                maxItems: 9
            }
        );

    }) || [];


    // --------------------------------------------------------
    // F. Dietary preferences
    // --------------------------------------------------------

    const diet = check(function () {

        return validateEnum(
            input.diet,
            DIETARY_PREFERENCES,
            "Dietary preference"
        );

    });


    // --------------------------------------------------------
    // G. Cooking preferences
    // --------------------------------------------------------

    const cookingStyles = check(function () {

        return validateStringArray(
            input.cookingStyles || [],
            "Cooking preferences",
            {
                allowedValues: COOKING_STYLES,
                maxItems: 9
            }
        );

    }) || [];


    let maxCookingTime = "Any";


    if (
        input.maxCookingTime !== undefined &&
        input.maxCookingTime !== null &&
        input.maxCookingTime !== "Any"
    ) {

        maxCookingTime = check(function () {

            return validateNumber(
                input.maxCookingTime,
                "Maximum cooking time",
                {
                    min: 1,
                    max: 600,
                    integer: true
                }
            );

        });

    }


    // --------------------------------------------------------
    // H. Calorie preferences
    // --------------------------------------------------------

    const calorieGoalType = check(function () {

        return validateEnum(
            input.calorieGoalType || "none",
            ["none", "per-adult"],
            "Calorie target preference"
        );

    });


    let calorieTarget = null;


    if (calorieGoalType === "per-adult") {

        calorieTarget = check(function () {

            return validateNumber(
                input.calorieTarget,
                "Adult daily calorie target",
                {
                    min: 500,
                    max: 6000,
                    integer: true
                }
            );

        });

    }


    // --------------------------------------------------------
    // I. Allergies
    // --------------------------------------------------------

    const allergies = check(function () {

        return validateStringArray(
            input.allergies || [],
            "Food allergies",
            {
                maxItems: 30,
                maxItemLength: 80
            }
        );

    }) || [];


    // --------------------------------------------------------
    // J. Disliked ingredients
    // --------------------------------------------------------

    const dislikedIngredients = check(function () {

        return validateStringArray(
            input.dislikedIngredients || [],
            "Disliked ingredients",
            {
                maxItems: 50,
                maxItemLength: 80
            }
        );

    }) || [];


    // --------------------------------------------------------
    // K. Weekly grocery budget
    // --------------------------------------------------------

    const weeklyBudget = check(function () {

        return validateWeeklyBudget(
            input.weeklyBudget
        );

    });


    const budgetScope = check(function () {

        return validateEnum(
            input.budgetScope,
            ["all-meals", "selected-meals"],
            "Budget scope"
        );

    });


    // --------------------------------------------------------
    // L. Pantry inventory
    // --------------------------------------------------------

    let pantryItems = [];


    if (
        input.pantryItems !== undefined &&
        !Array.isArray(input.pantryItems)
    ) {

        errors.push("Pantry items must be provided as an array.");

    } else if (Array.isArray(input.pantryItems)) {

        if (input.pantryItems.length > 200) {

            errors.push(
                "Pantry inventory cannot contain more than 200 items."
            );

        } else {

            pantryItems = input.pantryItems.map(
                function (item, index) {

                    try {

                        return validatePantryItem(
                            item,
                            index
                        );

                    } catch (error) {

                        errors.push(error.message);

                        return null;

                    }

                }
            ).filter(Boolean);

        }

    }


    // --------------------------------------------------------
    // M. Finish validation
    // --------------------------------------------------------

    if (errors.length > 0) {

        throw new ValidationError(
            "Household preferences contain invalid information.",
            errors
        );

    }


    // Return a clean, consistent household object.
    return {

        retailer: retailer,

        shoppingLocation: shoppingLocation,

        adultCount: adultCount,

        childCount: childCount,

        totalHouseholdMembers:
            adultCount + childCount,

        childAgeGroups: childAgeGroups,

        days: days,

        mealTypes: mealTypes,

        appliances: appliances,

        diet: diet,

        cookingStyles: cookingStyles,

        maxCookingTime: maxCookingTime,

        calorieGoalType: calorieGoalType,

        calorieTarget: calorieTarget,

        allergies: allergies,

        dislikedIngredients: dislikedIngredients,

        weeklyBudget: weeklyBudget,

        budgetScope: budgetScope,

        pantryItems: pantryItems

    };

}


// ============================================================
// 8. VALIDATE PANTRY ITEM
// ============================================================

function validatePantryItem(item, index = 0) {

    validateObject(
        item,
        `Pantry item ${index + 1}`
    );


    const name = validateString(
        item.name,
        `Pantry item ${index + 1} name`,
        {
            maxLength: 80
        }
    );


    const quantity = validateNumber(
        item.quantity,
        `${name} quantity`,
        {
            min: 0.001,
            max: 100000
        }
    );


    const unit = validateString(
        item.unit || "each",
        `${name} unit`,
        {
            maxLength: 20,
            pattern: /^[a-zA-Z]+$/
        }
    );


    return {

        id: item.id
            ? validateString(
                item.id,
                `${name} ID`,
                { maxLength: 100 }
            )
            : null,

        name: name,

        quantity: quantity,

        unit: unit

    };

}


// ============================================================
// 9. VALIDATE SHOPPING ITEM
// ============================================================

function validateShoppingItem(item) {

    validateObject(item, "Shopping item");


    const name = validateString(
        item.name,
        "Shopping item name",
        {
            maxLength: 80
        }
    );


    const quantity = validateNumber(
        item.quantity,
        "Shopping item quantity",
        {
            min: 0.001,
            max: 100000
        }
    );


    const unit = validateEnum(
        item.unit,
        GROCERY_UNITS,
        "Shopping item unit"
    );


    const category = validateEnum(
        item.category || "Other",
        GROCERY_CATEGORIES,
        "Shopping item category"
    );


    let unitCost = null;


    if (
        item.unitCost !== null &&
        item.unitCost !== undefined &&
        item.unitCost !== ""
    ) {

        unitCost = validateNumber(
            item.unitCost,
            "Shopping item unit price",
            {
                min: 0,
                max: 1000000
            }
        );

    }


    return {

        id: item.id || null,

        name: name,

        quantity: quantity,

        unit: unit,

        category: category,

        unitCost: unitCost,

        purchased: Boolean(item.purchased)

    };

}


// ============================================================
// 10. VALIDATE RECIPE SEARCH FILTERS
// ============================================================

// This function provides a convenient way to validate all
// the recipe filters received from the frontend.

function validateRecipeFilters(query) {

    return validateRecipeSearchQuery(query);

}


// ============================================================
// 11. VALIDATE MEAL PLAN REQUEST
// ============================================================

function validateMealPlanRequest(input) {

    validateObject(input, "Meal plan request");


    const preferences = validateHouseholdPreferences(
        input.preferences
    );


    return {
        preferences: preferences
    };

}


// ============================================================
// 12. VALIDATE GROCERY PRICE REQUEST
// ============================================================

function validateGroceryPriceRequest(input) {

    validateObject(input, "Grocery price request");


    if (!Array.isArray(input.items)) {

        throw new ValidationError(
            "Grocery items must be provided as an array."
        );

    }


    if (
        input.items.length === 0 ||
        input.items.length > 50
    ) {

        throw new ValidationError(
            "Provide between 1 and 50 grocery items."
        );

    }


    const items = input.items.map(function (item, index) {

        if (typeof item === "string") {

            return validateString(
                item,
                `Grocery item ${index + 1}`,
                {
                    maxLength: 80
                }
            );

        }


        const validatedItem = validateObject(
            item,
            `Grocery item ${index + 1}`
        );


        return validateShoppingItem(validatedItem);

    });


    let retailer = "";


    if (
        input.retailer !== undefined &&
        input.retailer !== ""
    ) {

        retailer = validateString(
            input.retailer,
            "Preferred retailer",
            {
                maxLength: 80
            }
        );

    }


    return {

        items: items,

        retailer: retailer

    };

}


// ============================================================
// 13. VALIDATE NUTRITION REQUEST
// ============================================================

function validateNutritionRequest(input) {

    validateObject(input, "Nutrition request");


    const ingredients = validateStringArray(
        input.ingredients,
        "Nutrition ingredients",
        {
            required: true,
            maxItems: 100,
            maxItemLength: 120
        }
    );


    if (ingredients.length === 0) {

        throw new ValidationError(
            "At least one ingredient is required."
        );

    }


    return {

        ingredients: ingredients

    };

}


// ============================================================
// 14. EXPORT VALIDATION FUNCTIONS
// ============================================================

export {

    ValidationError,

    DIETARY_PREFERENCES,

    CHILD_AGE_GROUPS,

    MEAL_TYPES,

    DAYS_OF_WEEK,

    APPLIANCES,

    COOKING_STYLES,

    GROCERY_CATEGORIES,

    GROCERY_UNITS,

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

};


// ============================================================
// END OF VALIDATORS.JS
// ============================================================
