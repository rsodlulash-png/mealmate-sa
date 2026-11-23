// ============================================================
// MEALMATE SA
// Shopping List Management
// File: public/js/shopping-list.js
// ============================================================

"use strict";

(function () {

    // ========================================================
    // 1. GET HTML ELEMENTS
    // ========================================================

    const addShoppingItemForm = document.getElementById(
        "addShoppingItemForm"
    );

    const shoppingListMessage = document.getElementById(
        "shoppingListMessage"
    );

    const shoppingCategories = document.getElementById(
        "shoppingCategories"
    );

    const shoppingCategoryTemplate = document.getElementById(
        "shoppingCategoryTemplate"
    );

    const shoppingItemTemplate = document.getElementById(
        "shoppingItemTemplate"
    );

    const shoppingEmptyState = document.getElementById(
        "shoppingEmptyState"
    );

    const shoppingSearch = document.getElementById("shoppingSearch");

    const shoppingCategoryFilter = document.getElementById(
        "shoppingCategoryFilter"
    );

    const shoppingStatusFilter = document.getElementById(
        "shoppingStatusFilter"
    );

    const printShoppingListButton = document.getElementById(
        "printShoppingList"
    );

    const clearPurchasedButton = document.getElementById(
        "clearPurchasedItems"
    );

    const clearShoppingListButton = document.getElementById(
        "clearShoppingList"
    );


    // Summary elements.
    const totalItemsElement = document.getElementById("totalItems");

    const purchasedItemsElement = document.getElementById(
        "purchasedItems"
    );

    const shoppingEstimatedTotalElement = document.getElementById(
        "shoppingEstimatedTotal"
    );

    const shoppingBudgetRemainingElement = document.getElementById(
        "shoppingBudgetRemaining"
    );

    const shoppingProgressText = document.getElementById(
        "shoppingProgressText"
    );

    const shoppingProgressPercentage = document.getElementById(
        "shoppingProgressPercentage"
    );

    const shoppingProgressFill = document.getElementById(
        "shoppingProgressFill"
    );

    const shoppingProgressTrack = document.getElementById(
        "shoppingProgressTrack"
    );


    // Retailer information.
    const shoppingRetailerElement = document.getElementById(
        "shoppingRetailer"
    );

    const shoppingLocationElement = document.getElementById(
        "shoppingLocation"
    );


    // Budget information.
    const shoppingWeeklyBudgetElement = document.getElementById(
        "shoppingWeeklyBudget"
    );

    const shoppingTotalCostElement = document.getElementById(
        "shoppingTotalCost"
    );

    const shoppingPurchasedCostElement = document.getElementById(
        "shoppingPurchasedCost"
    );

    const shoppingRemainingBudgetElement = document.getElementById(
        "shoppingRemainingBudget"
    );


    // ========================================================
    // 2. CHECK REQUIRED DEPENDENCIES
    // ========================================================

    if (
        !window.MealMateStorage ||
        !window.MealMateApp ||
        !shoppingCategories ||
        !shoppingItemTemplate ||
        !shoppingCategoryTemplate
    ) {

        console.error(
            "Shopping list could not initialize. " +
            "Check app.js and storage.js."
        );

        return;

    }


    // ========================================================
    // 3. SHOPPING CATEGORY ORDER
    // ========================================================

    const CATEGORY_ORDER = [

        "Vegetables",
        "Fruits",
        "Meat and Poultry",
        "Fish and Seafood",
        "Dairy and Eggs",
        "Grains and Bakery",
        "Pantry",
        "Other"

    ];


    // ========================================================
    // 4. INITIALIZE SHOPPING LIST
    // ========================================================

    function initializeShoppingList() {

        loadShoppingPreferences();

        importMealPlanIngredients();

        loadShoppingList();

        // Add custom shopping item.
        addShoppingItemForm.addEventListener(
            "submit",
            handleAddShoppingItem
        );

        // Search shopping items.
        shoppingSearch.addEventListener(
            "input",
            loadShoppingList
        );

        // Filter by category.
        shoppingCategoryFilter.addEventListener(
            "change",
            loadShoppingList
        );

        // Filter by purchase status.
        shoppingStatusFilter.addEventListener(
            "change",
            loadShoppingList
        );

        // Print shopping list.
        printShoppingListButton.addEventListener(
            "click",
            function () {
                window.print();
            }
        );

        // Remove purchased items.
        clearPurchasedButton.addEventListener(
            "click",
            removePurchasedItems
        );

        // Clear entire shopping list.
        clearShoppingListButton.addEventListener(
            "click",
            removeEntireShoppingList
        );


        // Refresh the data if the user returns to this tab.
        document.addEventListener(
            "visibilitychange",
            function () {

                if (!document.hidden) {

                    loadShoppingPreferences();

                    loadShoppingList();

                }

            }
        );


        console.log("MealMate SA shopping list initialized.");

    }


    // ========================================================
    // 5. FORMAT CURRENCY
    // ========================================================

    function formatMoney(amount) {

        return window.MealMateApp.formatCurrency(amount);

    }


    // ========================================================
    // 6. DISPLAY MESSAGES
    // ========================================================

    function displayShoppingMessage(message, type = "success") {

        window.MealMateApp.showMessage(
            shoppingListMessage,
            message,
            type
        );

    }


    function clearShoppingMessage() {

        window.MealMateApp.clearMessage(
            shoppingListMessage
        );

    }


    // ========================================================
    // 7. LOAD HOUSEHOLD SHOPPING PREFERENCES
    // ========================================================

    function loadShoppingPreferences() {

        const preferences = window.MealMateStorage.getPreferences();

        if (!preferences) {

            shoppingRetailerElement.textContent =
                "No supermarket selected";

            shoppingLocationElement.textContent =
                "Complete your household questionnaire.";

            shoppingWeeklyBudgetElement.textContent = "Not set";

            return;

        }


        shoppingRetailerElement.textContent =
            preferences.retailer || "Not set";


        shoppingLocationElement.textContent =
            preferences.shoppingLocation || "Location not set";


        const budget = Number(preferences.weeklyBudget);

        shoppingWeeklyBudgetElement.textContent =
            Number.isFinite(budget) && budget > 0
                ? formatMoney(budget)
                : "Not set";

    }


    // ========================================================
    // 8. NORMALISE INGREDIENT UNITS
    // ========================================================

    function normaliseUnit(unit) {

        if (!unit) {
            return "each";
        }

        const cleanedUnit = String(unit)
            .trim()
            .toLowerCase();

        const unitMap = {

            kg: "kg",
            kilogram: "kg",
            kilograms: "kg",

            g: "g",
            gram: "g",
            grams: "g",

            l: "l",
            litre: "l",
            litres: "l",
            liter: "l",
            liters: "l",

            ml: "ml",
            millilitre: "ml",
            millilitres: "ml",

            each: "each",
            piece: "each",
            pieces: "each",

            pack: "pack",
            packs: "pack",

            bag: "bag",
            bags: "bag"

        };

        return unitMap[cleanedUnit] || cleanedUnit;

    }


    // ========================================================
    // 9. IDENTIFY INGREDIENT CATEGORIES
    // ========================================================

    function determineCategory(name, suppliedCategory = "") {

        if (
            CATEGORY_ORDER.includes(suppliedCategory)
        ) {
            return suppliedCategory;
        }


        const ingredient = String(name).toLowerCase();


        const vegetables = [
            "potato",
            "onion",
            "tomato",
            "carrot",
            "spinach",
            "cabbage",
            "broccoli",
            "pepper",
            "lettuce",
            "garlic",
            "ginger",
            "courgette",
            "zucchini",
            "pumpkin",
            "butternut"
        ];


        const fruits = [
            "apple",
            "banana",
            "orange",
            "mango",
            "pear",
            "grape",
            "lemon",
            "avocado",
            "pineapple",
            "strawberry"
        ];


        const meat = [
            "chicken",
            "beef",
            "lamb",
            "mutton",
            "pork",
            "mince",
            "sausage",
            "turkey"
        ];


        const fish = [
            "fish",
            "salmon",
            "tuna",
            "prawn",
            "shrimp",
            "sardine",
            "hake",
            "crab"
        ];


        const dairy = [
            "milk",
            "cheese",
            "butter",
            "cream",
            "yoghurt",
            "yogurt",
            "egg"
        ];


        const grains = [
            "bread",
            "flour",
            "rice",
            "pasta",
            "maize meal",
            "pap",
            "oats",
            "cereal",
            "roll"
        ];


        if (vegetables.some(item => ingredient.includes(item))) {
            return "Vegetables";
        }

        if (fruits.some(item => ingredient.includes(item))) {
            return "Fruits";
        }

        if (meat.some(item => ingredient.includes(item))) {
            return "Meat and Poultry";
        }

        if (fish.some(item => ingredient.includes(item))) {
            return "Fish and Seafood";
        }

        if (dairy.some(item => ingredient.includes(item))) {
            return "Dairy and Eggs";
        }

        if (grains.some(item => ingredient.includes(item))) {
            return "Grains and Bakery";
        }

        return "Pantry";

    }


    // ========================================================
    // 10. CREATE A SHOPPING ITEM ID
    // ========================================================

    function createItemId() {

        return window.MealMateApp.generateId();

    }


    // ========================================================
    // 11. FIND MEALS IN THE SAVED MEAL PLAN
    // ========================================================

    function getMealsFromPlan(plan) {

        if (!plan || typeof plan !== "object") {
            return [];
        }


        const schedule =
            plan.days ||
            plan.weeklyPlan ||
            plan.schedule;


        // If a day-by-day schedule exists, use it.
        if (Array.isArray(schedule)) {

            return schedule.flatMap(function (day) {

                return Array.isArray(day.meals)
                    ? day.meals
                    : [];

            });

        }


        if (schedule && typeof schedule === "object") {

            return Object.values(schedule).flatMap(function (day) {

                return Array.isArray(day)
                    ? day
                    : Array.isArray(day.meals)
                        ? day.meals
                        : [];

            });

        }


        // Some backend responses provide a meals array.
        if (Array.isArray(plan.meals)) {
            return plan.meals;
        }


        // Fall back to selected recipes.
        if (Array.isArray(plan.selectedRecipes)) {

            return plan.selectedRecipes;

        }


        return [];

    }


    // ========================================================
    // 12. READ STRUCTURED RECIPE INGREDIENTS
    // ========================================================

    function getMealIngredients(meal) {

        if (!meal || typeof meal !== "object") {
            return [];
        }


        const recipe = meal.recipe || meal.recipeDetails || meal;


        if (Array.isArray(recipe.ingredients)) {

            return recipe.ingredients;

        }

        return [];

    }


    // ========================================================
    // 13. AGGREGATE MEAL PLAN INGREDIENTS
    // ========================================================

    function aggregateMealIngredients(meals) {

        const ingredientMap = new Map();


        meals.forEach(function (meal) {

            const ingredients = getMealIngredients(meal);


            ingredients.forEach(function (ingredient) {

                const name = String(
                    ingredient.name ||
                    ingredient.ingredient ||
                    ""
                ).trim();


                const quantity = Number(
                    ingredient.quantity ??
                    ingredient.amount
                );


                const unit = normaliseUnit(ingredient.unit);


                // Quantities and units must be provided in a
                // structured format. Do not guess from instructions.
                if (
                    !name ||
                    !Number.isFinite(quantity) ||
                    quantity <= 0 ||
                    !ingredient.unit
                ) {
                    return;
                }


                const key = `${name.toLowerCase()}|${unit}`;


                if (!ingredientMap.has(key)) {

                    const unitCostValue =
                        ingredient.unitCost ??
                        ingredient.estimatedUnitCost ??
                        null;

                    const unitCost =
                        unitCostValue === null ||
                        unitCostValue === ""
                            ? null
                            : Number(unitCostValue);


                    ingredientMap.set(key, {

                        id: createItemId(),

                        name: name,

                        quantity: 0,

                        unit: unit,

                        category: determineCategory(
                            name,
                            ingredient.category || ""
                        ),

                        unitCost:
                            Number.isFinite(unitCost) &&
                            unitCost >= 0
                                ? unitCost
                                : null,

                        purchased: false,

                        source: "meal-plan"

                    });

                }


                const existing = ingredientMap.get(key);

                existing.quantity += quantity;


                // Use an available valid unit price.
                if (
                    existing.unitCost === null &&
                    ingredient.unitCost !== undefined &&
                    ingredient.unitCost !== null
                ) {

                    const newUnitCost = Number(ingredient.unitCost);

                    if (
                        Number.isFinite(newUnitCost) &&
                        newUnitCost >= 0
                    ) {
                        existing.unitCost = newUnitCost;
                    }

                }

            });

        });


        return Array.from(ingredientMap.values());

    }


    // ========================================================
    // 14. SUBTRACT PANTRY INVENTORY
    // ========================================================

    function subtractPantryItems(requiredIngredients) {

        const pantry = window.MealMateStorage.getPantry();


        return requiredIngredients.map(function (ingredient) {

            const available = pantry
                .filter(function (pantryItem) {

                    return (
                        pantryItem.name.trim().toLowerCase() ===
                            ingredient.name.trim().toLowerCase() &&
                        normaliseUnit(pantryItem.unit) ===
                            normaliseUnit(ingredient.unit)
                    );

                })
                .reduce(function (total, pantryItem) {

                    return total + Number(pantryItem.quantity || 0);

                }, 0);


            const remaining = Math.max(
                0,
                ingredient.quantity - available
            );


            return {
                ...ingredient,
                quantity: remaining
            };

        }).filter(function (ingredient) {

            return ingredient.quantity > 0;

        });

    }


    // ========================================================
    // 15. IMPORT INGREDIENTS FROM MEAL PLAN
    // ========================================================

    function importMealPlanIngredients() {

        const plan = window.MealMateStorage.getMealPlan();

        if (!plan) {
            return;
        }


        const meals = getMealsFromPlan(plan);

        if (meals.length === 0) {
            return;
        }


        const requiredIngredients = aggregateMealIngredients(meals);


        if (requiredIngredients.length === 0) {
            return;
        }


        const ingredientsAfterPantry = subtractPantryItems(
            requiredIngredients
        );


        // Keep custom items and replace the previously generated
        // meal-plan items.
        const existingItems = window.MealMateStorage.getShoppingList();


        const previousMealPlanItems = existingItems.filter(
            item => item.source === "meal-plan"
        );


        const purchasedItems = new Map();


        previousMealPlanItems.forEach(function (item) {

            if (item.purchased) {

                const key =
                    `${item.name.toLowerCase()}|${normaliseUnit(item.unit)}`;

                purchasedItems.set(key, item);

            }

        });


        const generatedItems = ingredientsAfterPantry.map(
            function (ingredient) {

                const key =
                    `${ingredient.name.toLowerCase()}|${normaliseUnit(ingredient.unit)}`;

                const previous = purchasedItems.get(key);


                return {

                    ...ingredient,

                    // Preserve the purchased state only if the
                    // previous purchase covered the new quantity.
                    purchased: Boolean(
                        previous &&
                        Number(previous.quantity) >= ingredient.quantity
                    )

                };

            }
        );


        const customItems = existingItems.filter(
            item => item.source !== "meal-plan"
        );


        const updatedShoppingList = [
            ...customItems,
            ...generatedItems
        ];


        if (
            !window.MealMateStorage.saveShoppingList(
                updatedShoppingList
            )
        ) {

            console.error(
                "Could not import meal plan ingredients into the shopping list."
            );

            return;

        }


        console.log(
            `${generatedItems.length} meal-plan ingredients added to shopping list.`
        );

    }


    // ========================================================
    // 16. HANDLE ADDING A CUSTOM SHOPPING ITEM
    // ========================================================

    function handleAddShoppingItem(event) {

        event.preventDefault();

        clearShoppingMessage();


        const formData = new FormData(addShoppingItemForm);


        const name = String(
            formData.get("itemName") || ""
        ).trim();


        const quantity = Number(
            formData.get("quantity")
        );


        const unit = formData.get("unit");

        const category = formData.get("category");


        const rawCost = formData.get("unitCost");

        const unitCost = rawCost === null || rawCost.trim() === ""
            ? null
            : Number(rawCost);


        // Validate name.
        if (!name || name.length > 80) {

            displayShoppingMessage(
                "Please enter an item name of up to 80 characters.",
                "error"
            );

            return;

        }


        // Validate quantity.
        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            displayShoppingMessage(
                "Please enter a valid quantity greater than zero.",
                "error"
            );

            return;

        }


        // Validate unit price if supplied.
        if (
            unitCost !== null &&
            (
                !Number.isFinite(unitCost) ||
                unitCost < 0
            )
        ) {

            displayShoppingMessage(
                "Please enter a valid estimated unit price.",
                "error"
            );

            return;

        }


        const newItem = {

            id: createItemId(),

            name: name,

            quantity: quantity,

            unit: unit,

            category: category,

            unitCost: unitCost,

            purchased: false,

            source: "custom"

        };


        const savedItem =
            window.MealMateStorage.addShoppingItem(newItem);


        if (!savedItem) {

            displayShoppingMessage(
                "The shopping item could not be saved. Please try again.",
                "error"
            );

            return;

        }


        addShoppingItemForm.reset();


        window.MealMateStorage.addActivity(
            `${name} added to the shopping list`,
            "shopping"
        );


        loadShoppingList();


        displayShoppingMessage(
            `${name} has been added to your shopping list.`,
            "success"
        );

    }


    // ========================================================
    // 17. GET SHOPPING ITEMS
    // ========================================================

    function getShoppingItems() {

        return window.MealMateStorage.getShoppingList();

    }


    // ========================================================
    // 18. FILTER SHOPPING ITEMS
    // ========================================================

    function filterShoppingItems(items) {

        const searchTerm = shoppingSearch.value
            .trim()
            .toLowerCase();


        const selectedCategory = shoppingCategoryFilter.value;

        const selectedStatus = shoppingStatusFilter.value;


        return items.filter(function (item) {

            const matchesSearch = (

                item.name.toLowerCase().includes(searchTerm) ||

                String(item.category || "")
                    .toLowerCase()
                    .includes(searchTerm)

            );


            const matchesCategory =
                selectedCategory === "all" ||
                item.category === selectedCategory;


            const matchesStatus =
                selectedStatus === "all" ||

                (
                    selectedStatus === "needed" &&
                    !item.purchased
                ) ||

                (
                    selectedStatus === "purchased" &&
                    item.purchased
                );


            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );

        });

    }


    // ========================================================
    // 19. GET CATEGORY ORDER
    // ========================================================

    function getCategoryIndex(category) {

        const index = CATEGORY_ORDER.indexOf(category);

        return index === -1
            ? CATEGORY_ORDER.length
            : index;

    }


    // ========================================================
    // 20. GROUP SHOPPING ITEMS BY CATEGORY
    // ========================================================

    function groupShoppingItems(items) {

        const groups = new Map();


        items.forEach(function (item) {

            const category = CATEGORY_ORDER.includes(item.category)
                ? item.category
                : "Other";


            if (!groups.has(category)) {
                groups.set(category, []);
            }


            groups.get(category).push(item);

        });


        return Array.from(groups.entries()).sort(
            function (a, b) {

                return getCategoryIndex(a[0]) -
                    getCategoryIndex(b[0]);

            }
        );

    }


    // ========================================================
    // 21. CALCULATE ITEM COST
    // ========================================================

    function calculateItemCost(item) {

        if (
            item.unitCost === null ||
            item.unitCost === undefined ||
            item.unitCost === ""
        ) {
            return null;
        }


        const quantity = Number(item.quantity);

        const unitCost = Number(item.unitCost);


        if (
            !Number.isFinite(quantity) ||
            !Number.isFinite(unitCost) ||
            quantity < 0 ||
            unitCost < 0
        ) {
            return null;
        }


        return quantity * unitCost;

    }


    // ========================================================
    // 22. CALCULATE SHOPPING COST SUMMARY
    // ========================================================

    function calculateCostSummary(items) {

        let total = 0;

        let unknownPrices = 0;


        items.forEach(function (item) {

            const cost = calculateItemCost(item);


            if (cost === null) {

                unknownPrices++;

            } else {

                total += cost;

            }

        });


        return {

            total: total,

            unknownPrices: unknownPrices,

            complete: unknownPrices === 0

        };

    }


    // ========================================================
    // 23. DISPLAY COST SUMMARY
    // ========================================================

    function formatCostSummary(summary) {

        if (summary.unknownPrices > 0) {

            return `Known subtotal: ${formatMoney(summary.total)}`;

        }


        return formatMoney(summary.total);

    }


    // ========================================================
    // 24. UPDATE SHOPPING SUMMARY
    // ========================================================

    function updateShoppingSummary(items) {

        const totalItems = items.length;


        const purchasedItems = items.filter(function (item) {

            return item.purchased === true;

        });


        const purchasedCount = purchasedItems.length;


        const allCosts = calculateCostSummary(items);

        const purchasedCosts = calculateCostSummary(
            purchasedItems
        );


        // Item counts.
        totalItemsElement.textContent = totalItems;

        purchasedItemsElement.textContent = purchasedCount;


        // Estimated total.
        shoppingEstimatedTotalElement.textContent =
            formatCostSummary(allCosts);

        shoppingTotalCostElement.textContent =
            formatCostSummary(allCosts);


        // Purchased cost.
        shoppingPurchasedCostElement.textContent =
            formatCostSummary(purchasedCosts);


        // Budget calculation.
        updateBudgetSummary(items, allCosts);


        // Shopping progress.
        updateShoppingProgress(totalItems, purchasedCount);

    }


    // ========================================================
    // 25. UPDATE BUDGET SUMMARY
    // ========================================================

    function updateBudgetSummary(items, costSummary) {

        const preferences =
            window.MealMateStorage.getPreferences();


        const budget = preferences
            ? Number(preferences.weeklyBudget)
            : null;


        if (
            budget === null ||
            !Number.isFinite(budget) ||
            budget <= 0
        ) {

            shoppingBudgetRemainingElement.textContent =
                "Not set";

            shoppingRemainingBudgetElement.textContent =
                "Not set";

            return;

        }


        // Do not show a misleading remaining budget if some
        // items do not have price information.
        if (!costSummary.complete) {

            shoppingBudgetRemainingElement.textContent =
                "Unavailable";

            shoppingRemainingBudgetElement.textContent =
                "Unavailable";

            return;

        }


        const remaining = budget - costSummary.total;


        shoppingBudgetRemainingElement.textContent =
            formatMoney(remaining);

        shoppingRemainingBudgetElement.textContent =
            formatMoney(remaining);


        if (remaining < 0) {

            shoppingBudgetRemainingElement.classList.add(
                "over-budget"
            );

            shoppingRemainingBudgetElement.title =
                "Your estimated shopping total exceeds your weekly budget.";

        } else {

            shoppingBudgetRemainingElement.classList.remove(
                "over-budget"
            );

            shoppingBudgetRemainingElement.removeAttribute("title");

        }

    }


    // ========================================================
    // 26. UPDATE SHOPPING PROGRESS
    // ========================================================

    function updateShoppingProgress(total, purchased) {

        const percentage = total > 0
            ? Math.round((purchased / total) * 100)
            : 0;


        shoppingProgressPercentage.textContent =
            `${percentage}%`;


        shoppingProgressText.textContent =
            total === 0
                ? "Your shopping list is empty."
                : `${purchased} of ${total} items purchased.`;


        shoppingProgressFill.style.width =
            `${percentage}%`;


        shoppingProgressTrack.setAttribute(
            "aria-valuenow",
            String(percentage)
        );

    }


    // ========================================================
    // 27. CREATE A SHOPPING ITEM ELEMENT
    // ========================================================

    function createShoppingItemElement(item) {

        const clone = shoppingItemTemplate.content
            .firstElementChild
            .cloneNode(true);


        const checkbox = clone.querySelector(
            ".shopping-item-checkbox"
        );

        const name = clone.querySelector(
            ".shopping-item-name"
        );

        const quantity = clone.querySelector(
            ".shopping-item-quantity"
        );

        const cost = clone.querySelector(
            ".shopping-item-cost"
        );

        const deleteButton = clone.querySelector(
            ".shopping-item-delete"
        );


        // Display item information safely.
        name.textContent = item.name;


        quantity.textContent =
            `${item.quantity} ${item.unit}`;


        const itemCost = calculateItemCost(item);


        cost.textContent = itemCost === null
            ? "Price unavailable"
            : formatMoney(itemCost);


        // Display purchased state.
        checkbox.checked = Boolean(item.purchased);

        clone.classList.toggle(
            "is-purchased",
            checkbox.checked
        );


        // Mark item as purchased or needed.
        checkbox.addEventListener("change", function () {

            const saved = window.MealMateStorage.updateShoppingItem(
                item.id,
                {
                    purchased: checkbox.checked
                }
            );


            if (!saved) {

                displayShoppingMessage(
                    "Could not update the shopping item.",
                    "error"
                );

                return;

            }


            window.MealMateStorage.addActivity(

                checkbox.checked
                    ? `${item.name} marked as purchased`
                    : `${item.name} marked as needed`,

                "shopping"

            );


            loadShoppingList();

        });


        // Delete item.
        deleteButton.setAttribute(
            "aria-label",
            `Remove ${item.name} from shopping list`
        );


        deleteButton.addEventListener("click", function () {

            deleteShoppingItem(item.id);

        });


        return clone;

    }


    // ========================================================
    // 28. CREATE A SHOPPING CATEGORY
    // ========================================================

    function createShoppingCategory(category, items) {

        const clone = shoppingCategoryTemplate.content
            .firstElementChild
            .cloneNode(true);


        const title = clone.querySelector(".category-title");

        const count = clone.querySelector(".category-item-count");

        const itemsContainer = clone.querySelector(".shopping-items");


        title.textContent = category;

        count.textContent =
            `${items.length} ${items.length === 1 ? "item" : "items"}`;


        items.forEach(function (item) {

            itemsContainer.appendChild(
                createShoppingItemElement(item)
            );

        });


        return clone;

    }


    // ========================================================
    // 29. DISPLAY SHOPPING ITEMS
    // ========================================================

    function renderShoppingItems(items) {

        shoppingCategories.replaceChildren();


        const groups = groupShoppingItems(items);


        if (groups.length === 0) {

            const emptyMessage = document.createElement("p");

            emptyMessage.className = "empty-state";

            emptyMessage.textContent =
                "No shopping items match your current search or filters.";

            shoppingCategories.appendChild(emptyMessage);

            return;

        }


        groups.forEach(function ([category, categoryItems]) {

            shoppingCategories.appendChild(
                createShoppingCategory(category, categoryItems)
            );

        });

    }


    // ========================================================
    // 30. LOAD SHOPPING LIST
    // ========================================================

    function loadShoppingList() {

        const allItems = getShoppingItems();


        // Always calculate summaries from the complete list,
        // not just the currently filtered items.
        updateShoppingSummary(allItems);


        // Show the empty state only when the entire list is empty.
        if (allItems.length === 0) {

            shoppingEmptyState.classList.remove("hidden");

            shoppingCategories.replaceChildren();

            return;

        }


        shoppingEmptyState.classList.add("hidden");


        // Apply filters before displaying items.
        const filteredItems = filterShoppingItems(allItems);


        renderShoppingItems(filteredItems);

    }


    // ========================================================
    // 31. DELETE AN INDIVIDUAL SHOPPING ITEM
    // ========================================================

    function deleteShoppingItem(itemId) {

        const items = getShoppingItems();

        const item = items.find(function (shoppingItem) {

            return shoppingItem.id === itemId;

        });


        if (!item) {
            return;
        }


        const deleted = window.MealMateStorage.deleteShoppingItem(
            itemId
        );


        if (!deleted) {

            displayShoppingMessage(
                "Could not remove the shopping item.",
                "error"
            );

            return;

        }


        window.MealMateStorage.addActivity(
            `${item.name} removed from the shopping list`,
            "shopping"
        );


        loadShoppingList();


        displayShoppingMessage(
            `${item.name} removed successfully.`,
            "success"
        );

    }


    // ========================================================
    // 32. REMOVE PURCHASED ITEMS
    // ========================================================

    function removePurchasedItems() {

        const items = getShoppingItems();

        const purchasedCount = items.filter(
            item => item.purchased
        ).length;


        if (purchasedCount === 0) {

            displayShoppingMessage(
                "There are no purchased items to remove.",
                "error"
            );

            return;

        }


        const confirmed = window.confirm(
            `Remove ${purchasedCount} purchased item(s) from your list?`
        );


        if (!confirmed) {
            return;
        }


        const saved = window.MealMateStorage.clearPurchasedItems();


        if (!saved) {

            displayShoppingMessage(
                "Could not remove purchased items.",
                "error"
            );

            return;

        }


        window.MealMateStorage.addActivity(
            `${purchasedCount} purchased items removed from the shopping list`,
            "shopping"
        );


        loadShoppingList();


        displayShoppingMessage(
            "Purchased items have been removed.",
            "success"
        );

    }


    // ========================================================
    // 33. CLEAR THE ENTIRE SHOPPING LIST
    // ========================================================

    function removeEntireShoppingList() {

        const items = getShoppingItems();


        if (items.length === 0) {

            displayShoppingMessage(
                "Your shopping list is already empty.",
                "error"
            );

            return;

        }


        const confirmed = window.confirm(
            "Are you sure you want to clear your entire shopping list? " +
            "This action cannot be undone."
        );


        if (!confirmed) {
            return;
        }


        const saved = window.MealMateStorage.clearShoppingList();


        if (!saved) {

            displayShoppingMessage(
                "Could not clear your shopping list.",
                "error"
            );

            return;

        }


        window.MealMateStorage.addActivity(
            "The entire shopping list was cleared",
            "shopping"
        );


        loadShoppingList();


        displayShoppingMessage(
            "Your shopping list has been cleared.",
            "success"
        );

    }


    // ========================================================
    // 34. INITIALIZE THE PAGE
    // ========================================================

    initializeShoppingList();

})();

// ============================================================
// END OF SHOPPING-LIST.JS
// ============================================================
