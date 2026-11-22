// ============================================================
// MEALMATE SA
// Browser Storage Management
// File: public/js/storage.js
// ============================================================

"use strict";

(function () {

    // ========================================================
    // 1. STORAGE KEYS
    // ========================================================

    // Each type of information has its own storage key.
    // The v1 suffix helps us manage future data structure changes.

    const STORAGE_KEYS = {
        preferences: "mealmateSA.v1.preferences",
        mealPlan: "mealmateSA.v1.mealPlan",
        favourites: "mealmateSA.v1.favourites",
        shoppingList: "mealmateSA.v1.shoppingList",
        pantry: "mealmateSA.v1.pantry",
        activities: "mealmateSA.v1.activities"
    };


    // ========================================================
    // 2. CHECK BROWSER STORAGE AVAILABILITY
    // ========================================================

    function isStorageAvailable() {
        try {
            const testKey = "mealmateSA.storageTest";

            window.localStorage.setItem(testKey, "test");
            window.localStorage.removeItem(testKey);

            return true;

        } catch (error) {
            console.error("Browser storage is unavailable:", error);
            return false;
        }
    }


    // ========================================================
    // 3. GENERATE UNIQUE IDS
    // ========================================================

    function createId() {

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
            "item-" +
            Date.now() +
            "-" +
            Math.random().toString(36).slice(2, 10)
        );
    }


    // ========================================================
    // 4. GENERAL SAVE FUNCTION
    // ========================================================

    function saveData(key, data) {

        try {
            const jsonData = JSON.stringify(data);

            if (jsonData === undefined) {
                throw new Error("Data could not be converted to JSON.");
            }

            window.localStorage.setItem(key, jsonData);

            return true;

        } catch (error) {
            console.error("Could not save data:", error);

            return false;
        }
    }


    // ========================================================
    // 5. GENERAL RETRIEVE FUNCTION
    // ========================================================

    function getData(key, defaultValue = null) {

        try {
            const savedData = window.localStorage.getItem(key);

            // Return the default when nothing has been saved.
            if (savedData === null) {
                return defaultValue;
            }

            return JSON.parse(savedData);

        } catch (error) {
            console.error("Could not retrieve stored data:", error);

            return defaultValue;
        }
    }


    // ========================================================
    // 6. GENERAL DELETE FUNCTION
    // ========================================================

    function removeData(key) {

        try {
            window.localStorage.removeItem(key);

            return true;

        } catch (error) {
            console.error("Could not remove stored data:", error);

            return false;
        }
    }


    // ========================================================
    // 7. HOUSEHOLD PREFERENCES
    // ========================================================

    function getPreferences() {
        return getData(STORAGE_KEYS.preferences, null);
    }


    function savePreferences(preferences) {

        if (
            !preferences ||
            typeof preferences !== "object" ||
            Array.isArray(preferences)
        ) {
            console.error("Invalid household preferences.");

            return false;
        }

        const updatedPreferences = {
            ...preferences,
            updatedAt: new Date().toISOString()
        };

        return saveData(
            STORAGE_KEYS.preferences,
            updatedPreferences
        );
    }


    function deletePreferences() {
        return removeData(STORAGE_KEYS.preferences);
    }


    // ========================================================
    // 8. WEEKLY MEAL PLAN
    // ========================================================

    function getMealPlan() {
        return getData(STORAGE_KEYS.mealPlan, null);
    }


    function saveMealPlan(mealPlan) {

        if (
            !mealPlan ||
            typeof mealPlan !== "object"
        ) {
            console.error("Invalid meal plan.");

            return false;
        }

        const updatedMealPlan = Array.isArray(mealPlan)
            ? mealPlan
            : {
                ...mealPlan,
                updatedAt: new Date().toISOString()
            };

        return saveData(
            STORAGE_KEYS.mealPlan,
            updatedMealPlan
        );
    }


    function deleteMealPlan() {
        return removeData(STORAGE_KEYS.mealPlan);
    }


    // ========================================================
    // 9. FAVOURITE RECIPES
    // ========================================================

    function getFavourites() {
        const favourites = getData(
            STORAGE_KEYS.favourites,
            []
        );

        return Array.isArray(favourites) ? favourites : [];
    }


    function getRecipeId(recipe) {

        if (!recipe || typeof recipe !== "object") {
            return null;
        }

        return (
            recipe.id ||
            recipe.idMeal ||
            recipe.recipeId ||
            null
        );
    }


    function saveFavourites(favourites) {

        if (!Array.isArray(favourites)) {
            console.error("Favourites must be an array.");

            return false;
        }

        return saveData(
            STORAGE_KEYS.favourites,
            favourites
        );
    }


    function addFavourite(recipe) {

        if (!recipe || typeof recipe !== "object") {
            console.error("Invalid recipe.");

            return false;
        }

        const favourites = getFavourites();

        const recipeId = getRecipeId(recipe);

        if (!recipeId) {
            console.error("Recipe must have an ID.");

            return false;
        }

        // Do not save the same recipe twice.
        const alreadyExists = favourites.some(function (item) {
            return String(getRecipeId(item)) === String(recipeId);
        });

        if (alreadyExists) {
            return false;
        }

        const favouriteRecipe = {
            ...recipe,
            savedAt: new Date().toISOString()
        };

        favourites.push(favouriteRecipe);

        return saveFavourites(favourites);
    }


    function removeFavourite(recipeId) {

        const favourites = getFavourites();

        const updatedFavourites = favourites.filter(function (recipe) {
            return String(getRecipeId(recipe)) !== String(recipeId);
        });

        return saveFavourites(updatedFavourites);
    }


    function isFavourite(recipeId) {

        return getFavourites().some(function (recipe) {
            return String(getRecipeId(recipe)) === String(recipeId);
        });
    }


    // ========================================================
    // 10. SHOPPING LIST
    // ========================================================

    function getShoppingList() {

        const shoppingList = getData(
            STORAGE_KEYS.shoppingList,
            []
        );

        return Array.isArray(shoppingList) ? shoppingList : [];
    }


    function saveShoppingList(items) {

        if (!Array.isArray(items)) {
            console.error("Shopping list must be an array.");

            return false;
        }

        return saveData(
            STORAGE_KEYS.shoppingList,
            items
        );
    }


    // Add a new grocery item.
    function addShoppingItem(item) {

        if (
            !item ||
            typeof item !== "object" ||
            typeof item.name !== "string" ||
            !item.name.trim()
        ) {
            console.error("Invalid shopping item.");

            return null;
        }

        const quantity = Number(item.quantity);

        if (!Number.isFinite(quantity) || quantity <= 0) {
            console.error("Shopping item quantity must be positive.");

            return null;
        }

        const unitCost = item.unitCost === "" ||
            item.unitCost === null ||
            item.unitCost === undefined
            ? null
            : Number(item.unitCost);

        if (
            unitCost !== null &&
            (!Number.isFinite(unitCost) || unitCost < 0)
        ) {
            console.error("Invalid shopping item price.");

            return null;
        }

        const newItem = {
            id: item.id || createId(),
            name: item.name.trim(),
            quantity: quantity,
            unit: item.unit || "each",
            category: item.category || "Other",
            unitCost: unitCost,
            purchased: Boolean(item.purchased),
            source: item.source || "custom",
            createdAt: new Date().toISOString()
        };

        const shoppingList = getShoppingList();

        shoppingList.push(newItem);

        const saved = saveShoppingList(shoppingList);

        return saved ? newItem : null;
    }


    // Update an existing grocery item.
    function updateShoppingItem(itemId, updates) {

        if (!itemId || !updates || typeof updates !== "object") {
            return false;
        }

        const shoppingList = getShoppingList();

        const itemIndex = shoppingList.findIndex(function (item) {
            return item.id === itemId;
        });

        if (itemIndex === -1) {
            console.warn("Shopping item was not found:", itemId);

            return false;
        }

        const updatedItem = {
            ...shoppingList[itemIndex],
            ...updates,
            id: shoppingList[itemIndex].id
        };

        if (
            typeof updatedItem.name !== "string" ||
            !updatedItem.name.trim()
        ) {
            return false;
        }

        const quantity = Number(updatedItem.quantity);

        if (!Number.isFinite(quantity) || quantity <= 0) {
            return false;
        }

        if (
            updatedItem.unitCost !== null &&
            updatedItem.unitCost !== undefined &&
            (
                !Number.isFinite(Number(updatedItem.unitCost)) ||
                Number(updatedItem.unitCost) < 0
            )
        ) {
            return false;
        }

        updatedItem.name = updatedItem.name.trim();
        updatedItem.quantity = quantity;

        shoppingList[itemIndex] = updatedItem;

        return saveShoppingList(shoppingList);
    }


    // Delete one grocery item.
    function deleteShoppingItem(itemId) {

        const shoppingList = getShoppingList();

        const updatedList = shoppingList.filter(function (item) {
            return item.id !== itemId;
        });

        if (updatedList.length === shoppingList.length) {
            return false;
        }

        return saveShoppingList(updatedList);
    }


    // Remove all items already purchased.
    function clearPurchasedItems() {

        const shoppingList = getShoppingList();

        const remainingItems = shoppingList.filter(function (item) {
            return !item.purchased;
        });

        return saveShoppingList(remainingItems);
    }


    // Remove the entire grocery list.
    function clearShoppingList() {
        return removeData(STORAGE_KEYS.shoppingList);
    }


    // ========================================================
    // 11. PANTRY INVENTORY
    // ========================================================

    function getPantry() {

        const pantry = getData(
            STORAGE_KEYS.pantry,
            []
        );

        return Array.isArray(pantry) ? pantry : [];
    }


    function savePantry(pantryItems) {

        if (!Array.isArray(pantryItems)) {
            console.error("Pantry inventory must be an array.");

            return false;
        }

        return saveData(
            STORAGE_KEYS.pantry,
            pantryItems
        );
    }


    function addPantryItem(item) {

        if (
            !item ||
            typeof item !== "object" ||
            typeof item.name !== "string" ||
            !item.name.trim()
        ) {
            return null;
        }

        const quantity = Number(item.quantity);

        if (!Number.isFinite(quantity) || quantity <= 0) {
            return null;
        }

        const pantryItem = {
            id: item.id || createId(),
            name: item.name.trim(),
            quantity: quantity,
            unit: item.unit || "each"
        };

        const pantry = getPantry();

        pantry.push(pantryItem);

        return savePantry(pantry) ? pantryItem : null;
    }


    function deletePantryItem(itemId) {

        const pantry = getPantry();

        const updatedPantry = pantry.filter(function (item) {
            return item.id !== itemId;
        });

        if (updatedPantry.length === pantry.length) {
            return false;
        }

        return savePantry(updatedPantry);
    }


    // ========================================================
    // 12. RECENT ACTIVITY
    // ========================================================

    function getActivities() {

        const activities = getData(
            STORAGE_KEYS.activities,
            []
        );

        return Array.isArray(activities) ? activities : [];
    }


    function addActivity(message, type = "general") {

        if (
            typeof message !== "string" ||
            !message.trim()
        ) {
            return false;
        }

        const activities = getActivities();

        const newActivity = {
            id: createId(),
            message: message.trim(),
            type: type,
            createdAt: new Date().toISOString()
        };

        // New activities appear first.
        activities.unshift(newActivity);

        // Keep only the 20 most recent activities.
        const recentActivities = activities.slice(0, 20);

        return saveData(
            STORAGE_KEYS.activities,
            recentActivities
        );
    }


    function clearActivities() {
        return removeData(STORAGE_KEYS.activities);
    }


    // ========================================================
    // 13. CLEAR ALL MEALMATE SA DATA
    // ========================================================

    function clearAllData() {

        let successful = true;

        Object.values(STORAGE_KEYS).forEach(function (key) {

            const removed = removeData(key);

            if (!removed) {
                successful = false;
            }

        });

        return successful;
    }


    // ========================================================
    // 14. STORAGE PUBLIC API
    // ========================================================

    // Other JavaScript files access these functions through:
    // window.MealMateStorage

    window.MealMateStorage = Object.freeze({

        // General storage
        isStorageAvailable,

        // Household preferences
        getPreferences,
        savePreferences,
        deletePreferences,

        // Meal plans
        getMealPlan,
        saveMealPlan,
        deleteMealPlan,

        // Favourites
        getFavourites,
        saveFavourites,
        addFavourite,
        removeFavourite,
        isFavourite,

        // Shopping list
        getShoppingList,
        saveShoppingList,
        addShoppingItem,
        updateShoppingItem,
        deleteShoppingItem,
        clearPurchasedItems,
        clearShoppingList,

        // Pantry
        getPantry,
        savePantry,
        addPantryItem,
        deletePantryItem,

        // Recent activity
        getActivities,
        addActivity,
        clearActivities,

        // All application data
        clearAllData

    });


    // ========================================================
    // 15. INITIALIZATION
    // ========================================================

    if (isStorageAvailable()) {
        console.log("MealMate SA storage initialized successfully.");
    } else {
        console.warn(
            "MealMate SA could not access browser storage. " +
            "Saved information may not persist."
        );
    }

})();

// ============================================================
// END OF STORAGE.JS
// ============================================================
