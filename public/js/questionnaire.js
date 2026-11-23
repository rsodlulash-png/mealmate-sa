// ============================================================
// MEALMATE SA
// Household Questionnaire
// File: public/js/questionnaire.js
// ============================================================

"use strict";


// ============================================================
// 1. GET FORM ELEMENTS
// ============================================================

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


// ============================================================
// 2. CHECK THAT THE REQUIRED ELEMENTS EXIST
// ============================================================

if (!questionnaireForm) {
    console.warn("The household questionnaire form was not found.");

} else if (!window.MealMateStorage) {
    console.error(
        "MealMateStorage is unavailable. " +
        "Check that storage.js is loaded before questionnaire.js."
    );

} else {

    initializeQuestionnaire();

}


// ============================================================
// 3. INITIALIZE THE QUESTIONNAIRE
// ============================================================

function initializeQuestionnaire() {

    updateConditionalFields();

    // Show or hide the additional retailer input.
    retailerSelect.addEventListener("change", function () {
        updateConditionalFields();
    });

    // Show or hide the calorie target input.
    calorieGoalSelect.addEventListener("change", function () {
        updateConditionalFields();
    });

    // Handle form submission.
    questionnaireForm.addEventListener("submit", handleSubmission);

    // Restore the default visibility after clearing the form.
    questionnaireForm.addEventListener("reset", function () {
        window.setTimeout(updateConditionalFields, 0);
    });

    // Clear old messages when the user edits the form.
    questionnaireForm.addEventListener("input", function () {
        clearQuestionnaireMessage();
    });

    questionnaireForm.addEventListener("change", function () {
        clearQuestionnaireMessage();
    });

    console.log("MealMate SA questionnaire initialized.");
}


// ============================================================
// 4. SHOW OR HIDE CONDITIONAL QUESTIONS
// ============================================================

function updateConditionalFields() {

    // Additional retailer field.
    const isOtherRetailer = retailerSelect.value === "Other";

    otherRetailerGroup.classList.toggle(
        "hidden",
        !isOtherRetailer
    );

    otherRetailerInput.required = isOtherRetailer;

    if (!isOtherRetailer) {
        otherRetailerInput.value = "";
    }


    // Calorie target field.
    const needsCalorieTarget =
        calorieGoalSelect.value === "per-adult";

    calorieTargetGroup.classList.toggle(
        "hidden",
        !needsCalorieTarget
    );

    calorieTargetInput.required = needsCalorieTarget;

    if (!needsCalorieTarget) {
        calorieTargetInput.value = "";
    }

}


// ============================================================
// 5. GET SELECTED CHECKBOX VALUES
// ============================================================

function getSelectedValues(fieldName) {

    const selectedElements = questionnaireForm.querySelectorAll(
        `input[name="${fieldName}"]:checked`
    );

    return Array.from(selectedElements).map(function (element) {
        return element.value;
    });

}


// ============================================================
// 6. SPLIT CUSTOM INGREDIENTS AND ALLERGIES
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
// 7. REMOVE DUPLICATE VALUES
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
// 8. VALIDATE HOUSEHOLD INFORMATION
// ============================================================

function validateQuestionnaire(data) {

    const errors = [];

    // Validate supermarket.
    if (!data.retailer) {
        errors.push("Please select your preferred supermarket.");
    }

    if (
        data.retailer === "Other" &&
        !data.otherRetailer.trim()
    ) {
        errors.push("Please enter your supermarket name.");
    }

    // Validate shopping location.
    if (!data.shoppingLocation.trim()) {
        errors.push("Please enter your shopping location.");
    }

    // Validate adults.
    if (
        !Number.isInteger(data.adultCount) ||
        data.adultCount < 1 ||
        data.adultCount > 30
    ) {
        errors.push("Enter a valid number of adults between 1 and 30.");
    }

    // Validate children.
    if (
        !Number.isInteger(data.childCount) ||
        data.childCount < 0 ||
        data.childCount > 30
    ) {
        errors.push("Enter a valid number of children between 0 and 30.");
    }

    // Require at least one day.
    if (data.days.length === 0) {
        errors.push("Please select at least one day for meal planning.");
    }

    // Require at least one meal type.
    if (data.mealTypes.length === 0) {
        errors.push("Please select at least one meal category.");
    }

    // Validate weekly grocery budget.
    if (
        !Number.isFinite(data.weeklyBudget) ||
        data.weeklyBudget < 1 ||
        data.weeklyBudget > 100000
    ) {
        errors.push("Enter a weekly budget between R1 and R100,000.");
    }

    // Validate calorie target when selected.
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

    if (
        data.budgetScope !== "all-meals" &&
        data.budgetScope !== "selected-meals"
    ) {
        errors.push("Please select a valid budget category.");
    }

    return errors;

}


// ============================================================
// 9. NORMALISE PANTRY UNITS
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
// 10. PARSE PANTRY INVENTORY
// ============================================================

// Expected format:
//
// Rice - 2 kg
// Cooking oil - 1 litre
// Potatoes - 2 kg
// Onions - 6
// Eggs - 12

function parsePantryInventory(pantryText) {

    if (!pantryText.trim()) {
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

        const unit = normalisePantryUnit(match[3] || "each");

        if (
            !name ||
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {
            invalidLines.push(line);
            return;
        }

        items.push({
            id: window.MealMateApp
                ? window.MealMateApp.generateId()
                : `pantry-${Date.now()}-${items.length}`,

            name: name,

            quantity: quantity,

            unit: unit
        });

    });

    return {
        items: items,
        invalidLines: invalidLines
    };

}


// ============================================================
// 11. COLLECT FORM INFORMATION
// ============================================================

function collectQuestionnaireData() {

    const formData = new FormData(questionnaireForm);

    const retailer = formData.get("retailer");

    const diet = formData.get("diet");

    const calorieGoalType = formData.get("calorieGoalType");

    const otherAllergies = splitCustomList(
        formData.get("otherAllergies")
    );

    const selectedAllergies = getSelectedValues("allergies");

    const otherDislikes = splitCustomList(
        formData.get("otherDislikes")
    );

    const selectedDislikes = getSelectedValues(
        "dislikedIngredients"
    );

    const adultCount = Number(formData.get("adultCount"));

    const childCount = Number(formData.get("childCount"));

    const weeklyBudget = Number(formData.get("weeklyBudget"));

    const calorieTarget = calorieGoalType === "per-adult"
        ? Number(formData.get("calorieTarget"))
        : null;

    const pantryResult = parsePantryInventory(
        formData.get("pantryItems") || ""
    );


    // Build the household preferences object.
    const preferences = {

        retailer: retailer === "Other"
            ? String(formData.get("otherRetailer") || "").trim()
            : retailer,

        otherRetailer: retailer === "Other"
            ? String(formData.get("otherRetailer") || "").trim()
            : "",

        shoppingLocation: String(
            formData.get("shoppingLocation") || ""
        ).trim(),

        adultCount: adultCount,

        childCount: childCount,

        totalHouseholdMembers: adultCount + childCount,

        childAgeGroups: getSelectedValues("childAgeGroups"),

        days: getSelectedValues("days"),

        mealTypes: getSelectedValues("mealTypes"),

        appliances: getSelectedValues("appliances"),

        diet: diet,

        cookingStyles: getSelectedValues("cookingStyles"),

        maxCookingTime: formData.get("maxCookingTime") === "Any"
            ? "Any"
            : Number(formData.get("maxCookingTime")),

        calorieGoalType: calorieGoalType,

        calorieTarget: calorieTarget,

        allergies: removeDuplicates([
            ...selectedAllergies,
            ...otherAllergies
        ]),

        customAllergies: otherAllergies,

        dislikedIngredients: removeDuplicates([
            ...selectedDislikes,
            ...otherDislikes
        ]),

        customDislikes: otherDislikes,

        weeklyBudget: weeklyBudget,

        budgetScope: formData.get("budgetScope"),

        pantryItems: pantryResult.items,

        createdAt: new Date().toISOString()

    };


    return {
        preferences: preferences,
        pantryResult: pantryResult
    };

}


// ============================================================
// 12. DISPLAY QUESTIONNAIRE FEEDBACK
// ============================================================

function displayQuestionnaireMessage(message, type = "success") {

    if (
        window.MealMateApp &&
        typeof window.MealMateApp.showMessage === "function"
    ) {
        window.MealMateApp.showMessage(
            questionnaireMessage,
            message,
            type
        );

        return;
    }

    questionnaireMessage.textContent = message;

    questionnaireMessage.classList.remove("hidden");

    questionnaireMessage.classList.toggle(
        "error-message",
        type === "error"
    );

    questionnaireMessage.classList.toggle(
        "success-message",
        type === "success"
    );

}


function clearQuestionnaireMessage() {

    if (
        window.MealMateApp &&
        typeof window.MealMateApp.clearMessage === "function"
    ) {
        window.MealMateApp.clearMessage(questionnaireMessage);
        return;
    }

    questionnaireMessage.textContent = "";
    questionnaireMessage.classList.add("hidden");

}


// ============================================================
// 13. HANDLE QUESTIONNAIRE SUBMISSION
// ============================================================

function handleSubmission(event) {

    event.preventDefault();

    clearQuestionnaireMessage();

    const collectedData = collectQuestionnaireData();

    const preferences = collectedData.preferences;

    const pantryResult = collectedData.pantryResult;


    // Validate all important information.
    const errors = validateQuestionnaire(preferences);

    if (errors.length > 0) {

        displayQuestionnaireMessage(
            errors.join(" "),
            "error"
        );

        return;
    }


    // Check whether browser storage is available.
    if (!window.MealMateStorage.isStorageAvailable()) {

        displayQuestionnaireMessage(
            "Your browser cannot save information. " +
            "Please enable browser storage and try again.",
            "error"
        );

        return;
    }


    // Preserve the original creation date when editing preferences.
    const existingPreferences =
        window.MealMateStorage.getPreferences();

    if (
        existingPreferences &&
        existingPreferences.createdAt
    ) {
        preferences.createdAt = existingPreferences.createdAt;
    }


    // Save preferences and pantry inventory.
    const pantrySaved = window.MealMateStorage.savePantry(
        pantryResult.items
    );

    const preferencesSaved = window.MealMateStorage.savePreferences(
        preferences
    );


    // Stop if either operation fails.
    if (!pantrySaved || !preferencesSaved) {

        displayQuestionnaireMessage(
            "We couldn't save all your information. " +
            "Please try again.",
            "error"
        );

        return;
    }


    // Record the user's activity.
    window.MealMateStorage.addActivity(
        "Household preferences updated",
        "preferences"
    );


    // Inform the user about pantry entries that were not understood.
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


    // Redirect after the success message has been displayed.
    window.setTimeout(function () {

        window.location.href = "dashboard.html";

    }, 1500);

}


// ============================================================
// END OF QUESTIONNAIRE.JS
// ============================================================
