
 // ============================================================
 // MEALMATE SA
 // Household Questionnaire
 // File: public/js/questionnaire.js
 // ============================================================

"use strict";


// ============================================================
// 1. CONFIGURATION AND FORM ELEMENTS
// ============================================================

const CHILD_AGE_GROUPS = [
    "0-2 years",
    "3-5 years",
    "6-12 years",
    "13-17 years"
];

const DIETARY_PREFERENCES = [
    "No restrictions",
    "Halaal",
    "Vegetarian",
    "Vegan"
];

const questionnaireForm = document.getElementById(
    "householdQuestionnaire"
);

const questionnaireMessage = document.getElementById(
    "questionnaireMessage"
);

const retailerSelect = document.getElementById("retailer");

const otherRetailerGroup = document.getElementById(
    "otherRetailerGroup"
);

const otherRetailerInput = document.getElementById("otherRetailer");

const calorieGoalSelect = document.getElementById("calorieGoalType");

const calorieTargetGroup = document.getElementById(
    "calorieTargetGroup"
);

const calorieTargetInput = document.getElementById("calorieTarget");

const adultCountInput = document.getElementById("adultCount");

const childCountInput = document.getElementById("childCount");

const adultPortionFactorInput = document.getElementById(
    "adultPortionFactor"
);

const childrenAgeBreakdown = document.getElementById(
    "childrenAgeBreakdown"
);

const childrenCountSummary = document.getElementById(
    "childrenCountSummary"
);


// ============================================================
// 2. CHECK REQUIRED ELEMENTS AND INITIALISE
// ============================================================

if (!questionnaireForm) {

    console.warn(
        "The household questionnaire form was not found."
    );

} else if (!window.MealMateStorage) {

    console.error(
        "MealMateStorage is unavailable. " +
        "Check that storage.js is loaded before questionnaire.js."
    );

} else {

    initializeQuestionnaire();

}


// ============================================================
// 3. INITIALISE THE QUESTIONNAIRE
// ============================================================

function initializeQuestionnaire() {

    // Restore previously saved information first.
    const restoration = restoreSavedPreferences();

    // Update the visibility of conditional fields.
    updateConditionalFields();

    updateChildFields();


    // Retailer selection.
    retailerSelect.addEventListener("change", function () {

        updateConditionalFields();

        clearQuestionnaireMessage();

    });


    // Calorie preference selection.
    calorieGoalSelect.addEventListener("change", function () {

        updateConditionalFields();

        clearQuestionnaireMessage();

    });


    // Total number of children.
    childCountInput.addEventListener("input", function () {

        updateChildFields();

        clearQuestionnaireMessage();

    });


    childCountInput.addEventListener("change", function () {

        const childCount = Number(childCountInput.value);

        // When there are no children, clear age-group counts.
        if (childCount === 0) {

            getAgeGroupInputs().forEach(function (input) {
                input.value = "0";
            });

        }

        updateChildFields();

    });


    // Individual age-group counts.
    getAgeGroupInputs().forEach(function (input) {

        input.addEventListener("input", function () {

            updateChildFields();

            clearQuestionnaireMessage();

        });

    });


    // Adult portion factor.
    adultPortionFactorInput.addEventListener(
        "input",
        clearQuestionnaireMessage
    );


    // Child portion factors.
    getPortionFactorInputs().forEach(function (input) {

        input.addEventListener("input", function () {
            clearQuestionnaireMessage();
        });

    });


    // Handle form submission.
    questionnaireForm.addEventListener(
        "submit",
        handleSubmission
    );


    // Restore visibility after resetting the form.
    questionnaireForm.addEventListener("reset", function () {

        window.setTimeout(function () {

            updateConditionalFields();

            updateChildFields();

            clearQuestionnaireMessage();

        }, 0);

    });


    // Clear feedback when the user edits the form.
    questionnaireForm.addEventListener("input", function () {
        clearQuestionnaireMessage();
    });


    questionnaireForm.addEventListener("change", function () {
        clearQuestionnaireMessage();
    });


    // Explain when an old saved profile needs a child breakdown.
    if (restoration.needsChildBreakdown) {

        displayQuestionnaireMessage(
            "Your previous household profile was restored. " +
            "Please enter the number of children in each age group " +
            "and configure their portion factors before saving.",
            "warning"
        );

    }


    console.log(
        "MealMate SA questionnaire initialized successfully."
    );

}


// ============================================================
// 4. RESTORE PREVIOUSLY SAVED PREFERENCES
// ============================================================

function restoreSavedPreferences() {

    const saved = window.MealMateStorage.getPreferences();

    if (
        !saved ||
        typeof saved !== "object" ||
        Array.isArray(saved)
    ) {

        return {
            restored: false,
            needsChildBreakdown: false
        };

    }


    // --------------------------------------------------------
    // A. SHOPPING INFORMATION
    // --------------------------------------------------------

    const retailerOptions = Array.from(
        retailerSelect.options
    ).map(function (option) {
        return option.value;
    });


    if (
        retailerOptions.includes(saved.retailer) &&
        saved.retailer !== "Other"
    ) {

        retailerSelect.value = saved.retailer;

        otherRetailerInput.value = "";

    } else if (saved.retailer) {

        retailerSelect.value = "Other";

        otherRetailerInput.value =
            saved.otherRetailer || saved.retailer;

    }


    setFieldValue(
        "shoppingLocation",
        saved.shoppingLocation
    );


    // --------------------------------------------------------
    // B. HOUSEHOLD SIZE
    // --------------------------------------------------------

    setFieldValue(
        "adultCount",
        saved.adultCount ?? 1
    );

    setFieldValue(
        "childCount",
        saved.childCount ?? 0
    );

    setFieldValue(
        "adultPortionFactor",
        saved.adultPortionFactor ?? 1
    );


    // --------------------------------------------------------
    // C. CHILD AGE-GROUP BREAKDOWN
    // --------------------------------------------------------

    const hasSavedChildBreakdown =
        saved.childrenByAgeGroup &&
        typeof saved.childrenByAgeGroup === "object" &&
        !Array.isArray(saved.childrenByAgeGroup);


    getAgeGroupInputs().forEach(function (input) {

        const ageGroup = input.dataset.childAgeCount;

        const count = hasSavedChildBreakdown
            ? saved.childrenByAgeGroup[ageGroup] ?? 0
            : 0;

        input.value = String(count);

    });


    // --------------------------------------------------------
    // D. CHILD PORTION FACTORS
    // --------------------------------------------------------

    getPortionFactorInputs().forEach(function (input) {

        const ageGroup = input.dataset.childPortionFactor;

        const factor = saved.childPortionFactors &&
            saved.childPortionFactors[ageGroup] !== undefined
            ? saved.childPortionFactors[ageGroup]
            : "";

        input.value = factor === null ? "" : String(factor);

    });


    // --------------------------------------------------------
    // E. WEEKLY SCHEDULE
    // --------------------------------------------------------

    restoreCheckboxValues(
        "days",
        saved.days || []
    );

    restoreCheckboxValues(
        "mealTypes",
        saved.mealTypes || []
    );


    // --------------------------------------------------------
    // F. KITCHEN APPLIANCES
    // --------------------------------------------------------

    restoreCheckboxValues(
        "appliances",
        saved.appliances || []
    );


    // --------------------------------------------------------
    // G. DIETARY PREFERENCES
    // --------------------------------------------------------

    restoreRadioValue(
        "diet",
        saved.diet || "No restrictions"
    );


    // --------------------------------------------------------
    // H. COOKING PREFERENCES
    // --------------------------------------------------------

    restoreCheckboxValues(
        "cookingStyles",
        saved.cookingStyles || []
    );

    setFieldValue(
        "maxCookingTime",
        saved.maxCookingTime ?? "Any"
    );


    // --------------------------------------------------------
    // I. CALORIE PREFERENCES
    // --------------------------------------------------------

    setFieldValue(
        "calorieGoalType",
        saved.calorieGoalType || "none"
    );

    setFieldValue(
        "calorieTarget",
        saved.calorieTarget ?? ""
    );


    // --------------------------------------------------------
    // J. ALLERGIES
    // --------------------------------------------------------

    const allergyValues = saved.allergies || [];

    const knownAllergies = getCheckboxOptions("allergies");

    const customAllergies = Array.isArray(
        saved.customAllergies
    )
        ? saved.customAllergies
        : allergyValues.filter(function (item) {
            return !knownAllergies.includes(item);
        });


    restoreCheckboxValues(
        "allergies",
        allergyValues
    );

    setFieldValue(
        "otherAllergies",
        customAllergies.join(", ")
    );


    // --------------------------------------------------------
    // K. DISLIKED INGREDIENTS
    // --------------------------------------------------------

    const dislikedValues =
        saved.dislikedIngredients || [];

    const knownDislikes = getCheckboxOptions(
        "dislikedIngredients"
    );

    const customDislikes = Array.isArray(
        saved.customDislikes
    )
        ? saved.customDislikes
        : dislikedValues.filter(function (item) {
            return !knownDislikes.includes(item);
        });


    restoreCheckboxValues(
        "dislikedIngredients",
        dislikedValues
    );

    setFieldValue(
        "otherDislikes",
        customDislikes.join(", ")
    );


    // --------------------------------------------------------
    // L. PANTRY INFORMATION
    // --------------------------------------------------------

    const savedPantry = Array.isArray(saved.pantryItems)
        ? saved.pantryItems
        : window.MealMateStorage.getPantry();

    const pantryText = savedPantry.map(function (item) {

        const unit = item.unit && item.unit !== "each"
            ? ` ${item.unit}`
            : "";

        return `${item.name} - ${item.quantity}${unit}`;

    }).join("\n");


    setFieldValue(
        "pantryItems",
        pantryText
    );


    // --------------------------------------------------------
    // M. WEEKLY BUDGET
    // --------------------------------------------------------

    setFieldValue(
        "weeklyBudget",
        saved.weeklyBudget ?? ""
    );

    setFieldValue(
        "budgetScope",
        saved.budgetScope || "all-meals"
    );


    // --------------------------------------------------------
    // N. RETURN RESTORATION INFORMATION
    // --------------------------------------------------------

    const hasChildren = Number(saved.childCount) > 0;

    return {

        restored: true,

        // Old preferences stored selected age-group names,
        // but did not record how many children belonged to each.
        // We deliberately do not guess the missing counts.
        needsChildBreakdown:
            hasChildren && !hasSavedChildBreakdown

    };

}


// ============================================================
// 5. FORM RESTORATION HELPERS
// ============================================================

function setFieldValue(fieldId, value) {

    const element = document.getElementById(fieldId);

    if (!element) {
        return;
    }

    if (value !== undefined && value !== null) {
        element.value = String(value);
    }

}


function restoreCheckboxValues(fieldName, selectedValues) {

    if (!Array.isArray(selectedValues)) {
        return;
    }

    const selected = new Set(
        selectedValues.map(String)
    );

    const checkboxes = questionnaireForm.querySelectorAll(
        `input[type="checkbox"][name="${fieldName}"]`
    );

    checkboxes.forEach(function (checkbox) {

        checkbox.checked = selected.has(checkbox.value);

    });

}


function restoreRadioValue(fieldName, selectedValue) {

    const radios = questionnaireForm.querySelectorAll(
        `input[type="radio"][name="${fieldName}"]`
    );

    radios.forEach(function (radio) {

        radio.checked = radio.value === selectedValue;

    });

}


function getCheckboxOptions(fieldName) {

    const checkboxes = questionnaireForm.querySelectorAll(
        `input[type="checkbox"][name="${fieldName}"]`
    );

    return Array.from(checkboxes).map(function (checkbox) {
        return checkbox.value;
    });

}


// ============================================================
// 6. CONDITIONAL FIELD VISIBILITY
// ============================================================

function updateConditionalFields() {

    // --------------------------------------------------------
    // OTHER RETAILER FIELD
    // --------------------------------------------------------

    const isOtherRetailer =
        retailerSelect.value === "Other";

    otherRetailerGroup.classList.toggle(
        "hidden",
        !isOtherRetailer
    );

    otherRetailerInput.required = isOtherRetailer;


    // --------------------------------------------------------
    // CALORIE TARGET FIELD
    // --------------------------------------------------------

    const needsCalorieTarget =
        calorieGoalSelect.value === "per-adult";

    calorieTargetGroup.classList.toggle(
        "hidden",
        !needsCalorieTarget
    );

    calorieTargetInput.required = needsCalorieTarget;


    // --------------------------------------------------------
    // CHILD AGE-GROUP FIELDS
    // --------------------------------------------------------

    updateChildFields();

}


// ============================================================
// 7. CHILD AGE-GROUP HELPERS
// ============================================================

function getAgeGroupInputs() {

    return Array.from(
        questionnaireForm.querySelectorAll(
            "[data-child-age-count]"
        )
    );

}


function getPortionFactorInputs() {

    return Array.from(
        questionnaireForm.querySelectorAll(
            "[data-child-portion-factor]"
        )
    );

}


// ============================================================
// 8. UPDATE CHILD AGE-GROUP AND PORTION FIELDS
// ============================================================

function updateChildFields() {

    if (
        !childCountInput ||
        !childrenAgeBreakdown
    ) {
        return;
    }


    const totalChildren = childCountInput.value === ""
        ? NaN
        : Number(childCountInput.value);

    const hasChildren =
        Number.isInteger(totalChildren) &&
        totalChildren > 0;

    childrenAgeBreakdown.classList.toggle(
        "hidden",
        !hasChildren
    );


    let assignedChildren = 0;

    let hasInvalidCount = false;


    CHILD_AGE_GROUPS.forEach(function (ageGroup) {

        const ageInput = getAgeGroupInputs().find(
            function (input) {
                return input.dataset.childAgeCount === ageGroup;
            }
        );

        const factorGroup = questionnaireForm.querySelector(
            `[data-portion-factor-group="${ageGroup}"]`
        );

        const factorInput = getPortionFactorInputs().find(
            function (input) {
                return input.dataset.childPortionFactor === ageGroup;
            }
        );


        if (!ageInput) {
            return;
        }


        const rawCount = ageInput.value;

        const count = rawCount === ""
            ? NaN
            : Number(rawCount);


        const validCount =
            Number.isInteger(count) &&
            count >= 0 &&
            count <= 30;

        const hasChildrenInGroup =
            validCount && count > 0;


        if (!validCount) {

            hasInvalidCount = true;

        } else {

            assignedChildren += count;

        }


        // Display the portion-factor input only when
        // the age group contains at least one child.
        if (factorGroup) {

            factorGroup.classList.toggle(
                "hidden",
                !hasChildrenInGroup
            );

        }


        if (factorInput) {

            factorInput.required = hasChildrenInGroup;

        }

    });


    // Update the live household count summary.
    if (childrenCountSummary) {

        if (!hasChildren) {

            childrenCountSummary.textContent =
                "No children are currently included in the household.";

        } else if (hasInvalidCount) {

            childrenCountSummary.textContent =
                "Please enter whole numbers for all age-group counts.";

        } else {

            childrenCountSummary.textContent =
                `${assignedChildren} of ${totalChildren} children assigned to age groups.`;

        }

    }

}


// ============================================================
// 9. GET SELECTED CHECKBOX VALUES
// ============================================================

function getSelectedValues(fieldName) {

    const selectedElements =
        questionnaireForm.querySelectorAll(
            `input[name="${fieldName}"]:checked`
        );

    return Array.from(selectedElements).map(function (element) {
        return element.value;
    });

}


// ============================================================
// 10. SPLIT CUSTOM INGREDIENTS AND ALLERGIES
// ============================================================

function splitCustomList(value) {

    if (!value || typeof value !== "string") {
        return [];
    }

    return value
        .split(/[,\n;]/)
        .map(function (item) {
            return item.trim();
        })
        .filter(function (item) {
            return item.length > 0;
        });

}


// ============================================================
// 11. REMOVE DUPLICATE VALUES
// ============================================================

function removeDuplicates(values) {

    const uniqueValues = new Map();

    values.forEach(function (value) {

        const cleanedValue = String(value).trim();

        if (cleanedValue) {

            uniqueValues.set(
                cleanedValue.toLowerCase(),
                cleanedValue
            );

        }

    });

    return Array.from(uniqueValues.values());

}


// ============================================================
// 12. READ NUMERIC FORM VALUES
// ============================================================

function readNumber(value) {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return NaN;
    }

    return Number(value);

}


// ============================================================
// 13. VALIDATE HOUSEHOLD INFORMATION
// ============================================================

function validateQuestionnaire(data, retailerSelection) {

    const errors = [];


    // --------------------------------------------------------
    // A. SHOPPING INFORMATION
    // --------------------------------------------------------

    if (
        !data.retailer ||
        typeof data.retailer !== "string" ||
        !data.retailer.trim()
    ) {

        errors.push(
            "Please select or enter your preferred supermarket."
        );

    }


    if (
        retailerSelection === "Other" &&
        !data.otherRetailer.trim()
    ) {

        errors.push(
            "Please enter your supermarket name."
        );

    }


    if (
        typeof data.shoppingLocation !== "string" ||
        !data.shoppingLocation.trim()
    ) {

        errors.push(
            "Please enter your shopping location."
        );

    }


    // --------------------------------------------------------
    // B. ADULTS AND CHILDREN
    // --------------------------------------------------------

    if (
        !Number.isInteger(data.adultCount) ||
        data.adultCount < 1 ||
        data.adultCount > 30
    ) {

        errors.push(
            "Enter a valid number of adults between 1 and 30."
        );

    }


    if (
        !Number.isInteger(data.childCount) ||
        data.childCount < 0 ||
        data.childCount > 30
    ) {

        errors.push(
            "Enter a valid number of children between 0 and 30."
        );

    }


    // --------------------------------------------------------
    // C. ADULT PORTION FACTOR
    // --------------------------------------------------------

    if (
        !Number.isFinite(data.adultPortionFactor) ||
        data.adultPortionFactor <= 0 ||
        data.adultPortionFactor > 10
    ) {

        errors.push(
            "Enter a valid adult portion factor greater than 0 and no greater than 10."
        );

    }


    // --------------------------------------------------------
    // D. CHILDREN'S AGE-GROUP COUNTS
    // --------------------------------------------------------

    if (
        !data.childrenByAgeGroup ||
        typeof data.childrenByAgeGroup !== "object" ||
        Array.isArray(data.childrenByAgeGroup)
    ) {

        errors.push(
            "Please provide children's age-group information."
        );

    } else {

        let groupedChildCount = 0;

        let invalidGroupCount = false;


        CHILD_AGE_GROUPS.forEach(function (ageGroup) {

            const count = data.childrenByAgeGroup[ageGroup];

            if (
                !Number.isInteger(count) ||
                count < 0 ||
                count > 30
            ) {

                invalidGroupCount = true;

            } else {

                groupedChildCount += count;

            }

        });


        if (invalidGroupCount) {

            errors.push(
                "Enter a valid whole number between 0 and 30 for every child age group."
            );

        } else if (
            Number.isInteger(data.childCount) &&
            groupedChildCount !== data.childCount
        ) {

            errors.push(
                `The age-group counts add up to ${groupedChildCount}, but your household has ${data.childCount} children. Please correct the counts.`
            );

        }

    }


    // --------------------------------------------------------
    // E. CHILD PORTION FACTORS
    // --------------------------------------------------------

    CHILD_AGE_GROUPS.forEach(function (ageGroup) {

        const groupCount = data.childrenByAgeGroup
            ? data.childrenByAgeGroup[ageGroup]
            : 0;


        if (!Number.isInteger(groupCount) || groupCount <= 0) {
            return;
        }


        const factor = data.childPortionFactors
            ? data.childPortionFactors[ageGroup]
            : undefined;


        if (
            !Number.isFinite(factor) ||
            factor <= 0 ||
            factor > 10
        ) {

            errors.push(
                `Please enter a valid portion factor for children aged ${ageGroup}.`
            );

        }

    });


    // --------------------------------------------------------
    // F. WEEKLY SCHEDULE
    // --------------------------------------------------------

    if (
        !Array.isArray(data.days) ||
        data.days.length === 0
    ) {

        errors.push(
            "Please select at least one day for meal planning."
        );

    }


    if (
        !Array.isArray(data.mealTypes) ||
        data.mealTypes.length === 0
    ) {

        errors.push(
            "Please select at least one meal category."
        );

    }


    // --------------------------------------------------------
    // G. DIETARY PREFERENCES
    // --------------------------------------------------------

    if (!DIETARY_PREFERENCES.includes(data.diet)) {

        errors.push(
            "Please select a valid dietary preference."
        );

    }


    // --------------------------------------------------------
    // H. COOKING TIME
    // --------------------------------------------------------

    if (
        data.maxCookingTime !== "Any" &&
        (
            !Number.isInteger(data.maxCookingTime) ||
            data.maxCookingTime < 1 ||
            data.maxCookingTime > 600
        )
    ) {

        errors.push(
            "Please select a valid maximum cooking time."
        );

    }


    // --------------------------------------------------------
    // I. CALORIE TARGET
    // --------------------------------------------------------

    if (data.calorieGoalType === "per-adult") {

        if (
            !Number.isInteger(data.calorieTarget) ||
            data.calorieTarget < 500 ||
            data.calorieTarget > 6000
        ) {

            errors.push(
                "Enter an adult daily calorie target between 500 and 6,000 kcal."
            );

        }

    }


    // --------------------------------------------------------
    // J. WEEKLY GROCERY BUDGET
    // --------------------------------------------------------

    if (
        !Number.isFinite(data.weeklyBudget) ||
        data.weeklyBudget < 1 ||
        data.weeklyBudget > 100000
    ) {

        errors.push(
            "Enter a weekly budget between R1 and R100,000."
        );

    }


    // --------------------------------------------------------
    // K. BUDGET SCOPE
    // --------------------------------------------------------

    if (
        data.budgetScope !== "all-meals" &&
        data.budgetScope !== "selected-meals"
    ) {

        errors.push(
            "Please select a valid budget category."
        );

    }


    // --------------------------------------------------------
    // L. CUSTOM ALLERGIES AND DISLIKES
    // --------------------------------------------------------

    if (data.allergies.length > 30) {

        errors.push(
            "You can enter a maximum of 30 allergies."
        );

    }


    if (data.dislikedIngredients.length > 50) {

        errors.push(
            "You can enter a maximum of 50 disliked ingredients."
        );

    }


    return errors;

}


// ============================================================
// 14. NORMALISE PANTRY UNITS
// ============================================================

function normalisePantryUnit(unit) {

    if (!unit) {
        return "each";
    }

    const cleanedUnit = unit.toLowerCase().trim();

    const unitMap = {

        kg: "kg",
        kgs: "kg",
        kilogram: "kg",
        kilograms: "kg",

        g: "g",
        gram: "g",
        grams: "g",

        l: "L",
        litre: "L",
        litres: "L",
        liter: "L",
        liters: "L",

        ml: "ml",
        millilitre: "ml",
        millilitres: "ml",
        milliliter: "ml",
        milliliters: "ml",

        each: "each",
        piece: "each",
        pieces: "each",

        pack: "pack",
        packs: "pack",

        bag: "bag",
        bags: "bag",

        bunch: "bunch",
        bunches: "bunch",

        dozen: "dozen"

    };

    return unitMap[cleanedUnit] || cleanedUnit;

}


// ============================================================
// 15. CREATE PANTRY ITEM ID
// ============================================================

function createPantryId() {

    if (
        window.MealMateApp &&
        typeof window.MealMateApp.generateId === "function"
    ) {

        return window.MealMateApp.generateId();

    }

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {

        return crypto.randomUUID();

    }

    return (
        "pantry-" +
        Date.now() +
        "-" +
        Math.random().toString(36).slice(2, 10)
    );

}


// ============================================================
// 16. PARSE PANTRY INVENTORY
// ============================================================

// Expected formats:
//
// Rice - 2 kg
// Cooking oil - 1 litre
// Potatoes - 2 kg
// Onions - 6
// Eggs - 12

function parsePantryInventory(pantryText) {

    if (
        typeof pantryText !== "string" ||
        !pantryText.trim()
    ) {

        return {
            items: [],
            invalidLines: []
        };

    }


    const lines = pantryText
        .split("\n")
        .map(function (line) {
            return line.trim();
        })
        .filter(Boolean);


    const items = [];

    const invalidLines = [];


    lines.forEach(function (line) {

        const match = line.match(
            /^(.+?)\s*[-:]\s*(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)?$/
        );


        if (!match) {

            invalidLines.push(line);

            return;

        }


        const name = match[1].trim();

        const quantity = Number(
            match[2].replace(",", ".")
        );

        const unit = normalisePantryUnit(
            match[3] || "each"
        );


        if (
            !name ||
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            invalidLines.push(line);

            return;

        }


        items.push({

            id: createPantryId(),

            name,

            quantity,

            unit

        });

    });


    return {

        items,

        invalidLines

    };

}


// ============================================================
// 17. COLLECT CHILD AGE-GROUP INFORMATION
// ============================================================

function collectChildrenByAgeGroup() {

    const childrenByAgeGroup = {};


    CHILD_AGE_GROUPS.forEach(function (ageGroup) {

        childrenByAgeGroup[ageGroup] = 0;

    });


    getAgeGroupInputs().forEach(function (input) {

        const ageGroup = input.dataset.childAgeCount;

        childrenByAgeGroup[ageGroup] = readNumber(
            input.value
        );

    });


    return childrenByAgeGroup;

}


// ============================================================
// 18. COLLECT CHILD PORTION FACTORS
// ============================================================

function collectChildPortionFactors(childrenByAgeGroup) {

    const childPortionFactors = {};


    getPortionFactorInputs().forEach(function (input) {

        const ageGroup = input.dataset.childPortionFactor;

        // Only include factors for age groups
        // that actually contain children.
        if (
            childrenByAgeGroup[ageGroup] <= 0 ||
            !Number.isFinite(childrenByAgeGroup[ageGroup])
        ) {
            return;
        }


        if (input.value.trim() === "") {
            return;
        }


        childPortionFactors[ageGroup] = readNumber(
            input.value
        );

    });


    return childPortionFactors;

}


// ============================================================
// 19. COLLECT ALL QUESTIONNAIRE INFORMATION
// ============================================================

function collectQuestionnaireData() {

    const formData = new FormData(questionnaireForm);


    // --------------------------------------------------------
    // A. BASIC FORM VALUES
    // --------------------------------------------------------

    const retailerSelection = String(
        formData.get("retailer") || ""
    );

    const otherRetailer = String(
        formData.get("otherRetailer") || ""
    ).trim();

    const calorieGoalType = String(
        formData.get("calorieGoalType") || "none"
    );


    // --------------------------------------------------------
    // B. HOUSEHOLD COUNTS
    // --------------------------------------------------------

    const adultCount = readNumber(
        formData.get("adultCount")
    );

    const childCount = readNumber(
        formData.get("childCount")
    );

    const adultPortionFactor = readNumber(
        formData.get("adultPortionFactor")
    );


    const childrenByAgeGroup =
        collectChildrenByAgeGroup();


    const childAgeGroups = CHILD_AGE_GROUPS.filter(
        function (ageGroup) {

            const count = childrenByAgeGroup[ageGroup];

            return Number.isFinite(count) && count > 0;

        }
    );


    const childPortionFactors =
        collectChildPortionFactors(childrenByAgeGroup);


    // --------------------------------------------------------
    // C. ALLERGIES AND DISLIKES
    // --------------------------------------------------------

    const otherAllergies = splitCustomList(
        formData.get("otherAllergies")
    );

    const selectedAllergies = getSelectedValues(
        "allergies"
    );

    const otherDislikes = splitCustomList(
        formData.get("otherDislikes")
    );

    const selectedDislikes = getSelectedValues(
        "dislikedIngredients"
    );


    // --------------------------------------------------------
    // D. CALORIE TARGET
    // --------------------------------------------------------

    const calorieTarget = calorieGoalType === "per-adult"
        ? readNumber(formData.get("calorieTarget"))
        : null;


    // --------------------------------------------------------
    // E. WEEKLY BUDGET
    // --------------------------------------------------------

    const weeklyBudget = readNumber(
        formData.get("weeklyBudget")
    );


    // --------------------------------------------------------
    // F. PANTRY INVENTORY
    // --------------------------------------------------------

    const pantryResult = parsePantryInventory(
        String(formData.get("pantryItems") || "")
    );


    // --------------------------------------------------------
    // G. BUILD HOUSEHOLD PREFERENCES
    // --------------------------------------------------------

    const preferences = {

        retailer: retailerSelection === "Other"
            ? otherRetailer
            : retailerSelection,

        otherRetailer: retailerSelection === "Other"
            ? otherRetailer
            : "",

        shoppingLocation: String(
            formData.get("shoppingLocation") || ""
        ).trim(),

        adultCount,

        childCount,

        totalHouseholdMembers:
            adultCount + childCount,

        adultPortionFactor,

        childAgeGroups,

        childrenByAgeGroup,

        childPortionFactors,

        days: getSelectedValues("days"),

        mealTypes: getSelectedValues("mealTypes"),

        appliances: getSelectedValues("appliances"),

        diet: formData.get("diet"),

        cookingStyles: getSelectedValues("cookingStyles"),

        maxCookingTime:
            formData.get("maxCookingTime") === "Any"
                ? "Any"
                : readNumber(formData.get("maxCookingTime")),

        calorieGoalType,

        calorieTarget,

        allergies: removeDuplicates([
            ...selectedAllergies,
            ...otherAllergies
        ]),

        customAllergies: removeDuplicates(
            otherAllergies
        ),

        dislikedIngredients: removeDuplicates([
            ...selectedDislikes,
            ...otherDislikes
        ]),

        customDislikes: removeDuplicates(
            otherDislikes
        ),

        weeklyBudget,

        budgetScope: formData.get("budgetScope"),

        pantryItems: pantryResult.items,

        createdAt: new Date().toISOString()

    };


    return {

        preferences,

        pantryResult,

        retailerSelection

    };

}


// ============================================================
// 20. DISPLAY QUESTIONNAIRE FEEDBACK
// ============================================================

function displayQuestionnaireMessage(
    message,
    type = "success"
) {

    if (!questionnaireMessage) {
        return;
    }


    questionnaireMessage.textContent = message;

    questionnaireMessage.classList.remove(
        "hidden",
        "error-message",
        "success-message",
        "warning-note"
    );


    if (type === "error") {

        questionnaireMessage.classList.add(
            "error-message"
        );

    } else if (type === "warning") {

        questionnaireMessage.classList.add(
            "warning-note"
        );

    } else {

        questionnaireMessage.classList.add(
            "success-message"
        );

    }


    // Use the shared application helper for normal messages.
    if (
        type !== "warning" &&
        window.MealMateApp &&
        typeof window.MealMateApp.showMessage === "function"
    ) {

        window.MealMateApp.showMessage(
            questionnaireMessage,
            message,
            type
        );

    }

}


// ============================================================
// 21. CLEAR QUESTIONNAIRE FEEDBACK
// ============================================================

function clearQuestionnaireMessage() {

    if (!questionnaireMessage) {
        return;
    }


    if (
        window.MealMateApp &&
        typeof window.MealMateApp.clearMessage === "function"
    ) {

        window.MealMateApp.clearMessage(
            questionnaireMessage
        );

    }


    questionnaireMessage.textContent = "";

    questionnaireMessage.classList.add("hidden");

    questionnaireMessage.classList.remove(
        "error-message",
        "success-message",
        "warning-note"
    );

}


// ============================================================
// 22. HANDLE QUESTIONNAIRE SUBMISSION
// ============================================================

function handleSubmission(event) {

    event.preventDefault();

    clearQuestionnaireMessage();


    // --------------------------------------------------------
    // A. COLLECT FORM INFORMATION
    // --------------------------------------------------------

    const collectedData = collectQuestionnaireData();

    const preferences = collectedData.preferences;

    const pantryResult = collectedData.pantryResult;

    const retailerSelection =
        collectedData.retailerSelection;


    // --------------------------------------------------------
    // B. VALIDATE HOUSEHOLD INFORMATION
    // --------------------------------------------------------

    const errors = validateQuestionnaire(
        preferences,
        retailerSelection
    );


    if (errors.length > 0) {

        displayQuestionnaireMessage(
            errors.join(" "),
            "error"
        );

        return;

    }


    // --------------------------------------------------------
    // C. CHECK BROWSER STORAGE
    // --------------------------------------------------------

    if (!window.MealMateStorage.isStorageAvailable()) {

        displayQuestionnaireMessage(
            "Your browser cannot save information. " +
            "Please enable browser storage and try again.",
            "error"
        );

        return;

    }


    // --------------------------------------------------------
    // D. PRESERVE THE ORIGINAL CREATION DATE
    // --------------------------------------------------------

    const existingPreferences =
        window.MealMateStorage.getPreferences();


    if (
        existingPreferences &&
        existingPreferences.createdAt
    ) {

        preferences.createdAt =
            existingPreferences.createdAt;

    }


    // --------------------------------------------------------
    // E. SAVE PANTRY AND HOUSEHOLD PREFERENCES
    // --------------------------------------------------------

    const pantrySaved =
        window.MealMateStorage.savePantry(
            pantryResult.items
        );


    const preferencesSaved =
        window.MealMateStorage.savePreferences(
            preferences
        );


    if (!pantrySaved || !preferencesSaved) {

        displayQuestionnaireMessage(
            "We couldn't save all your information. " +
            "Please try again.",
            "error"
        );

        return;

    }


    // --------------------------------------------------------
    // F. RECORD USER ACTIVITY
    // --------------------------------------------------------

    window.MealMateStorage.addActivity(
        "Household preferences updated",
        "preferences"
    );


    // --------------------------------------------------------
    // G. DISPLAY SUCCESS FEEDBACK
    // --------------------------------------------------------

    let successMessage =
        "Your household preferences have been saved successfully!";


    if (pantryResult.invalidLines.length > 0) {

        successMessage +=
            " " +
            pantryResult.invalidLines.length +
            " pantry line(s) were skipped. " +
            "Please use the format: Rice - 2 kg.";

    }


    displayQuestionnaireMessage(
        successMessage,
        "success"
    );


    // --------------------------------------------------------
    // H. REDIRECT TO THE DASHBOARD
    // --------------------------------------------------------

    window.setTimeout(function () {

        window.location.href = "dashboard.html";

    }, 1500);

}


// ============================================================
// END OF QUESTIONNAIRE.JS
// ============================================================
