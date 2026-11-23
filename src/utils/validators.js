
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

// ------------------------------------------------------------
// 3.1 CHECK WHETHER A VALUE IS A PLAIN OBJECT
// ------------------------------------------------------------

function isPlainObject(value) {

    if (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);

    return (
        prototype === Object.prototype ||
        prototype === null
    );

}


// ------------------------------------------------------------
// 3.2 VALIDATE OBJECT
// ------------------------------------------------------------

function validateObject(value, fieldName = "Input") {

    if (!isPlainObject(value)) {

        throw new ValidationError(
            `${fieldName} must be a valid object.`
        );

    }

    return value;

}


// ------------------------------------------------------------
// 3.3 VALIDATE STRING
// ------------------------------------------------------------

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

            throw new ValidationError(
                `${fieldName} is required.`
            );

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


    if (
        required &&
        cleanedValue.length < minLength
    ) {

        throw new ValidationError(
            `${fieldName} must contain at least ${minLength} characters.`
        );

    }


    if (cleanedValue.length > maxLength) {

        throw new ValidationError(
            `${fieldName} must not exceed ${maxLength} characters.`
        );

    }


    if (
        pattern &&
        !pattern.test(cleanedValue)
    ) {

        throw new ValidationError(
            `${fieldName} contains invalid characters.`
        );

    }


    return cleanedValue;

}


// ------------------------------------------------------------
// 3.4 VALIDATE NUMBER
// ------------------------------------------------------------

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


    // Only actual numbers and numeric strings are accepted.
    if (
        typeof value !== "number" &&
        typeof value !== "string"
    ) {

        throw new ValidationError(
            `${fieldName} must be a valid number.`
        );

    }


    if (
        value === "" ||
        value.trim?.() === ""
    ) {

        throw new ValidationError(
            `${fieldName} must be a valid number.`
        );

    }


    const number = Number(value);


    if (!Number.isFinite(number)) {

        throw new ValidationError(
            `${fieldName} must be a valid number.`
        );

    }


    if (
        integer &&
        !Number.isInteger(number)
    ) {

        throw new ValidationError(
            `${fieldName} must be a whole number.`
        );

    }


    if (
        number < min ||
        number > max
    ) {

        throw new ValidationError(
            `${fieldName} must be between ${min} and ${max}.`
        );

    }


    return number;

}


// ------------------------------------------------------------
// 3.5 VALIDATE ENUM
// ------------------------------------------------------------

function validateEnum(
    value,
    allowedValues,
    fieldName
) {

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


// ------------------------------------------------------------
// 3.6 VALIDATE STRING ARRAY
// ------------------------------------------------------------

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


    if (
        value === undefined ||
        value === null
    ) {

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


    // Remove duplicates while preserving their original order.
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

    validateObject(
        query,
        "Recipe search query"
    );


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


    const category =
        query.category === undefined ||
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
        search,
        category,
        sort,
        diet,
        maxTime
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


    // Collect validation errors so users can correct
    // multiple fields in one attempt.
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
    // A. SHOPPING INFORMATION
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
    // B. HOUSEHOLD SIZE
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
    // C. CHILDREN'S AGE GROUP COUNTS
    // --------------------------------------------------------

    // Expected data structure:
    //
    // childrenByAgeGroup: {
    //     "0-2 years": 0,
    //     "3-5 years": 1,
    //     "6-12 years": 2,
    //     "13-17 years": 0
    // }
    //
    // Counts must add up to childCount.

    const rawChildrenByAgeGroup = input.childrenByAgeGroup;

    const hasChildrenByAgeGroup =
        isPlainObject(rawChildrenByAgeGroup);


    const childrenByAgeGroup = {};


    // Initialise every supported age group.
    CHILD_AGE_GROUPS.forEach(function (ageGroup) {

        childrenByAgeGroup[ageGroup] = 0;

    });


    if (
        input.childrenByAgeGroup !== undefined &&
        input.childrenByAgeGroup !== null &&
        !hasChildrenByAgeGroup
    ) {

        errors.push(
            "Children by age group must be provided as an object."
        );

    }


    if (
        childCount !== null &&
        childCount > 0 &&
        !hasChildrenByAgeGroup
    ) {

        errors.push(
            "Please provide the number of children in each age group."
        );

    }


    if (hasChildrenByAgeGroup) {

        // Reject unknown age-group names.
        Object.keys(rawChildrenByAgeGroup).forEach(
            function (ageGroup) {

                if (!CHILD_AGE_GROUPS.includes(ageGroup)) {

                    errors.push(
                        `Unsupported child age group: ${ageGroup}.`
                    );

                }

            }
        );


        // Validate the number of children in each supported group.
        CHILD_AGE_GROUPS.forEach(function (ageGroup) {

            if (
                !Object.prototype.hasOwnProperty.call(
                    rawChildrenByAgeGroup,
                    ageGroup
                )
            ) {
                return;
            }


            const count = check(function () {

                return validateNumber(
                    rawChildrenByAgeGroup[ageGroup],
                    `Children in ${ageGroup}`,
                    {
                        min: 0,
                        max: 30,
                        integer: true
                    }
                );

            });


            if (count !== null) {
                childrenByAgeGroup[ageGroup] = count;
            }

        });

    }


    // Calculate the total number represented by age groups.
    const groupedChildCount = Object.values(
        childrenByAgeGroup
    ).reduce(function (total, count) {

        return total + count;

    }, 0);


    if (
        childCount !== null &&
        hasChildrenByAgeGroup &&
        groupedChildCount !== childCount
    ) {

        errors.push(
            "The number of children in the age groups must equal the total number of children."
        );

    }


    // Derive selected age groups from actual child counts.
    // This avoids maintaining two conflicting sources of truth.
    const childAgeGroups = CHILD_AGE_GROUPS.filter(
        function (ageGroup) {

            return childrenByAgeGroup[ageGroup] > 0;

        }
    );


    if (
        childCount !== null &&
        childCount > 0 &&
        childAgeGroups.length === 0
    ) {

        errors.push(
            "Please select at least one age group for the children."
        );

    }


    // Validate the legacy childAgeGroups property if supplied.
    // It must agree with the age-group counts.
    if (input.childAgeGroups !== undefined) {

        const suppliedAgeGroups = check(function () {

            return validateStringArray(
                input.childAgeGroups,
                "Children's age groups",
                {
                    allowedValues: CHILD_AGE_GROUPS,
                    maxItems: 4
                }
            );

        });


        if (suppliedAgeGroups !== null) {

            const sortedSupplied = [...suppliedAgeGroups].sort();

            const sortedDerived = [...childAgeGroups].sort();

            const matchesDerived =
                JSON.stringify(sortedSupplied) ===
                JSON.stringify(sortedDerived);


            if (!matchesDerived) {

                errors.push(
                    "Selected child age groups must match the age-group child counts."
                );

            }

        }

    }


    // --------------------------------------------------------
    // D. CHILD PORTION FACTORS
    // --------------------------------------------------------

    // Expected data structure:
    //
    // childPortionFactors: {
    //     "3-5 years": 0.5,
    //     "6-12 years": 0.75
    // }
    //
    // These are configurable household values.
    // They are not medical or nutritional recommendations.

    const rawChildPortionFactors = input.childPortionFactors;

    const hasChildPortionFactors =
        isPlainObject(rawChildPortionFactors);


    const childPortionFactors = {};


    if (
        input.childPortionFactors !== undefined &&
        input.childPortionFactors !== null &&
        !hasChildPortionFactors
    ) {

        errors.push(
            "Child portion factors must be provided as an object."
        );

    }


    // Reject unsupported factor keys.
    if (hasChildPortionFactors) {

        Object.keys(rawChildPortionFactors).forEach(
            function (ageGroup) {

                if (!CHILD_AGE_GROUPS.includes(ageGroup)) {

                    errors.push(
                        `Unsupported child portion-factor age group: ${ageGroup}.`
                    );

                }

            }
        );

    }


    // A factor is required for every age group with children.
    CHILD_AGE_GROUPS.forEach(function (ageGroup) {

        if (childrenByAgeGroup[ageGroup] === 0) {
            return;
        }


        if (
            !hasChildPortionFactors ||
            !Object.prototype.hasOwnProperty.call(
                rawChildPortionFactors,
                ageGroup
            )
        ) {

            errors.push(
                `Please provide a portion factor for children aged ${ageGroup}.`
            );

            return;

        }


        const factor = check(function () {

            const value = validateNumber(
                rawChildPortionFactors[ageGroup],
                `Portion factor for ${ageGroup}`,
                {
                    min: 0,
                    max: 10
                }
            );


            if (value <= 0) {

                throw new ValidationError(
                    `Portion factor for ${ageGroup} must be greater than zero.`
                );

            }


            return value;

        });


        if (factor !== null) {
            childPortionFactors[ageGroup] = factor;
        }

    });


    // --------------------------------------------------------
    // E. WEEKLY SCHEDULE
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


    if (days.length === 0) {

        errors.push(
            "Please select at least one day."
        );

    }


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


    if (mealTypes.length === 0) {

        errors.push(
            "Please select at least one meal type."
        );

    }


    // --------------------------------------------------------
    // F. KITCHEN APPLIANCES
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
    // G. DIETARY PREFERENCES
    // --------------------------------------------------------

    const diet = check(function () {

        return validateEnum(
            input.diet,
            DIETARY_PREFERENCES,
            "Dietary preference"
        );

    });


    // --------------------------------------------------------
    // H. COOKING PREFERENCES
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
    // I. ADULT PORTION FACTOR
    // --------------------------------------------------------

    // Defaults to one adult-equivalent serving per adult.
    // A custom value may be supplied by the household.

    let adultPortionFactor = 1;


    if (input.adultPortionFactor !== undefined) {

        adultPortionFactor = check(function () {

            const value = validateNumber(
                input.adultPortionFactor,
                "Adult portion factor",
                {
                    min: 0,
                    max: 10
                }
            );


            if (value <= 0) {

                throw new ValidationError(
                    "Adult portion factor must be greater than zero."
                );

            }


            return value;

        });

    }


    // --------------------------------------------------------
    // J. CALORIE PREFERENCES
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
    // K. FOOD ALLERGIES
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
    // L. DISLIKED INGREDIENTS
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
    // M. WEEKLY GROCERY BUDGET
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
    // N. PANTRY INVENTORY
    // --------------------------------------------------------

    let pantryItems = [];


    if (
        input.pantryItems !== undefined &&
        !Array.isArray(input.pantryItems)
    ) {

        errors.push(
            "Pantry items must be provided as an array."
        );

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
    // O. FINISH VALIDATION
    // --------------------------------------------------------

    if (errors.length > 0) {

        throw new ValidationError(
            "Household preferences contain invalid information.",
            errors
        );

    }


    // Return a clean and consistent household object.
    return {

        retailer,

        shoppingLocation,

        adultCount,

        childCount,

        totalHouseholdMembers:
            adultCount + childCount,

        childAgeGroups,

        childrenByAgeGroup,

        childPortionFactors,

        adultPortionFactor,

        days,

        mealTypes,

        appliances,

        diet,

        cookingStyles,

        maxCookingTime,

        calorieGoalType,

        calorieTarget,

        allergies,

        dislikedIngredients,

        weeklyBudget,

        budgetScope,

        pantryItems

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
                {
                    maxLength: 100
                }
            )
            : null,

        name,

        quantity,

        unit

    };

}


// ============================================================
// 9. VALIDATE SHOPPING ITEM
// ============================================================

function validateShoppingItem(item) {

    validateObject(
        item,
        "Shopping item"
    );


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


    let purchased = false;


    if (item.purchased !== undefined) {

        if (typeof item.purchased !== "boolean") {

            throw new ValidationError(
                "Shopping item purchased status must be true or false."
            );

        }

        purchased = item.purchased;

    }


    return {

        id: item.id || null,

        name,

        quantity,

        unit,

        category,

        unitCost,

        purchased

    };

}


// ============================================================
// 10. VALIDATE RECIPE SEARCH FILTERS
// ============================================================

function validateRecipeFilters(query) {

    return validateRecipeSearchQuery(query);

}


// ============================================================
// 11. VALIDATE MEAL PLAN REQUEST
// ============================================================

function validateMealPlanRequest(input) {

    validateObject(
        input,
        "Meal plan request"
    );


    const preferences = validateHouseholdPreferences(
        input.preferences
    );


    return {

        preferences

    };

}


// ============================================================
// 12. VALIDATE GROCERY PRICE REQUEST
// ============================================================

function validateGroceryPriceRequest(input) {

    validateObject(
        input,
        "Grocery price request"
    );


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


    const items = input.items.map(
        function (item, index) {

            // Allow simple grocery item names.
            if (typeof item === "string") {

                return validateString(
                    item,
                    `Grocery item ${index + 1}`,
                    {
                        maxLength: 80
                    }
                );

            }


            // Also support structured shopping items.
            const validatedItem = validateObject(
                item,
                `Grocery item ${index + 1}`
            );


            return validateShoppingItem(
                validatedItem
            );

        }
    );


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

        items,

        retailer

    };

}


// ============================================================
// 13. VALIDATE NUTRITION REQUEST
// ============================================================

function validateNutritionRequest(input) {

    validateObject(
        input,
        "Nutrition request"
    );


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

        ingredients

    };

}


// ============================================================
// 14. EXPORT PUBLIC FUNCTIONS AND CONSTANTS
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
