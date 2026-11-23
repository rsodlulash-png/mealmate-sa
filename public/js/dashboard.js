
// ============================================================
// MEALMATE SA
// Dashboard Management
// File: public/js/dashboard.js
// ============================================================

"use strict";

(function () {

    // ========================================================
    // 1. CONFIGURATION
    // ========================================================

    const DAYS_OF_WEEK = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];

    const RECIPE_PLACEHOLDER =
        "images/recipe-placeholder.svg";


    // ========================================================
    // 2. GET DASHBOARD ELEMENTS
    // ========================================================

    const householdSizeElement =
        document.getElementById("householdSize");

    const householdBreakdownElement =
        document.getElementById("householdBreakdown");

    const dietaryPreferenceElement =
        document.getElementById("dietaryPreference");

    const preferredRetailerElement =
        document.getElementById("preferredRetailer");

    const shoppingLocationElement =
        document.getElementById("shoppingLocation");

    const weeklyBudgetElement =
        document.getElementById("weeklyBudgetValue");

    const estimatedSpendElement =
        document.getElementById("estimatedSpend");

    const budgetRemainingElement =
        document.getElementById("budgetRemaining");

    const budgetProgressText =
        document.getElementById("budgetProgressText");

    const budgetPercentageElement =
        document.getElementById("budgetPercentage");

    const budgetProgressFill =
        document.getElementById("budgetProgressFill");

    const budgetProgressTrack =
        document.getElementById("budgetProgressTrack");

    const currentWeekLabel =
        document.getElementById("currentWeekLabel");

    const mealPlanContainer =
        document.getElementById("mealPlanContainer");

    const dashboardEmptyState =
        document.getElementById("dashboardEmptyState");

    const generateMealPlanButton =
        document.getElementById("generateMealPlanButton");

    const recentActivityElement =
        document.getElementById("recentActivity");


    // ========================================================
    // 3. CHECK REQUIRED DEPENDENCIES
    // ========================================================

    if (
        !window.MealMateStorage ||
        !window.MealMateApp
    ) {

        console.error(
            "Dashboard could not initialize. " +
            "Check that app.js and storage.js are loaded first."
        );

        return;

    }


    if (!mealPlanContainer) {

        console.error(
            "The meal plan container was not found."
        );

        return;

    }


    // ========================================================
    // 4. INITIALIZE DASHBOARD
    // ========================================================

    function initializeDashboard() {

        displayCurrentWeek();

        loadHouseholdOverview();

        loadBudgetInformation();

        loadWeeklyMealPlan();

        loadRecentActivity();


        if (generateMealPlanButton) {

            generateMealPlanButton.addEventListener(
                "click",
                handleGenerateMealPlan
            );

        }


        console.log(
            "MealMate SA dashboard initialized successfully."
        );

    }


    // ========================================================
    // 5. REUSABLE TEXT UPDATE FUNCTION
    // ========================================================

    function updateText(element, value) {

        if (!element) {
            return;
        }

        element.textContent = value;

    }


    // ========================================================
    // 6. FORMAT CURRENCY
    // ========================================================

    function formatMoney(amount) {

        return window.MealMateApp.formatCurrency(amount);

    }


    // ========================================================
    // 7. LOAD HOUSEHOLD OVERVIEW
    // ========================================================

    function loadHouseholdOverview() {

        const preferences =
            window.MealMateStorage.getPreferences();


        if (!preferences) {

            updateText(
                householdSizeElement,
                "Not set"
            );

            updateText(
                householdBreakdownElement,
                "Complete your questionnaire"
            );

            updateText(
                dietaryPreferenceElement,
                "Not set"
            );

            updateText(
                preferredRetailerElement,
                "Not set"
            );

            updateText(
                shoppingLocationElement,
                "Shopping location not set"
            );

            return;

        }


        const adults =
            Number(preferences.adultCount) || 0;

        const children =
            Number(preferences.childCount) || 0;

        const totalMembers =
            adults + children;


        updateText(
            householdSizeElement,
            `${totalMembers} ${totalMembers === 1 ? "member" : "members"}`
        );


        updateText(
            householdBreakdownElement,
            `${adults} ${adults === 1 ? "adult" : "adults"} and ` +
            `${children} ${children === 1 ? "child" : "children"}`
        );


        updateText(
            dietaryPreferenceElement,
            preferences.diet || "Not specified"
        );


        updateText(
            preferredRetailerElement,
            preferences.retailer || "Not set"
        );


        updateText(
            shoppingLocationElement,
            preferences.shoppingLocation || "Location not set"
        );

    }


    // ========================================================
    // 8. GET MEAL ENTRIES FROM DIFFERENT PLAN FORMATS
    // ========================================================

    function getMealEntries(plan) {

        if (!plan || typeof plan !== "object") {
            return [];
        }


        // Current backend response:
        // plan.mealPlan = [{day, mealType, recipe, portions}]

        if (Array.isArray(plan.mealPlan)) {
            return plan.mealPlan;
        }


        // Support older plan formats.
        if (Array.isArray(plan.meals)) {
            return plan.meals;
        }


        const source =
            plan.days ||
            plan.weeklyPlan ||
            plan.schedule;


        if (Array.isArray(source)) {

            const meals = [];

            source.forEach(function (day) {

                if (Array.isArray(day.meals)) {

                    day.meals.forEach(function (meal) {

                        meals.push({
                            ...meal,
                            day: meal.day || day.day || day.name
                        });

                    });

                }

            });

            return meals;

        }


        if (source && typeof source === "object") {

            const meals = [];

            Object.entries(source).forEach(
                function ([dayName, dayMeals]) {

                    if (Array.isArray(dayMeals)) {

                        dayMeals.forEach(function (meal) {

                            meals.push({
                                ...meal,
                                day: meal.day || dayName
                            });

                        });

                    }

                }
            );

            return meals;

        }


        return [];

    }


    // ========================================================
    // 9. GET ESTIMATED COST OF THE MEAL PLAN
    // ========================================================

    function getEstimatedPlanCost(plan) {

        if (!plan || typeof plan !== "object") {
            return null;
        }


        const possibleTotals = [

            plan.totalEstimatedCost,

            plan.estimatedTotalCost,

            plan.estimatedTotal,

            plan.totalCost,

            plan.estimatedCost,

            plan.budgetSummary?.estimatedTotal,

            plan.budgetSummary?.totalEstimatedCost

        ];


        for (const value of possibleTotals) {

            if (
                value !== undefined &&
                value !== null &&
                value !== "" &&
                Number.isFinite(Number(value)) &&
                Number(value) >= 0
            ) {

                return Number(value);

            }

        }


        // Check individual meal costs.
        const mealEntries = getMealEntries(plan);


        if (mealEntries.length > 0) {

            let total = 0;


            for (const meal of mealEntries) {

                const recipe = getRecipeFromMeal(meal);

                const cost =
                    meal.cost ??
                    recipe.estimatedCost ??
                    null;


                if (
                    cost === null ||
                    cost === undefined ||
                    cost === "" ||
                    !Number.isFinite(Number(cost)) ||
                    Number(cost) < 0
                ) {

                    // Do not pretend that missing prices are zero.
                    return null;

                }


                total += Number(cost);

            }


            return total;

        }


        // Support older selected recipe plans.
        if (Array.isArray(plan.selectedRecipes)) {

            if (plan.selectedRecipes.length === 0) {
                return null;
            }


            let total = 0;


            for (const recipe of plan.selectedRecipes) {

                if (
                    recipe.estimatedCost === null ||
                    recipe.estimatedCost === undefined ||
                    !Number.isFinite(Number(recipe.estimatedCost))
                ) {

                    return null;

                }


                total += Number(recipe.estimatedCost);

            }


            return total;

        }


        return null;

    }


    // ========================================================
    // 10. LOAD WEEKLY BUDGET INFORMATION
    // ========================================================

    function loadBudgetInformation() {

        const preferences =
            window.MealMateStorage.getPreferences();

        const mealPlan =
            window.MealMateStorage.getMealPlan();


        if (!preferences) {

            updateText(weeklyBudgetElement, "Not set");

            updateText(estimatedSpendElement, "Not available");

            updateText(budgetRemainingElement, "Not available");

            updateText(budgetPercentageElement, "—");

            updateText(
                budgetProgressText,
                "Complete your questionnaire to set a weekly budget."
            );

            updateProgressBar(0);

            return;

        }


        const weeklyBudget =
            Number(preferences.weeklyBudget);


        if (
            !Number.isFinite(weeklyBudget) ||
            weeklyBudget <= 0
        ) {

            updateText(
                weeklyBudgetElement,
                "Not set"
            );

        } else {

            updateText(
                weeklyBudgetElement,
                formatMoney(weeklyBudget)
            );

        }


        const estimatedSpend =
            getEstimatedPlanCost(mealPlan);


        if (estimatedSpend === null) {

            updateText(
                estimatedSpendElement,
                "Not available"
            );

            updateText(
                budgetRemainingElement,
                "Not available"
            );

            updateText(
                budgetPercentageElement,
                "—"
            );

            updateText(
                budgetProgressText,
                "Recipe prices are currently unavailable. Your budget total cannot yet be calculated."
            );

            updateProgressBar(0);

            return;

        }


        updateText(
            estimatedSpendElement,
            formatMoney(estimatedSpend)
        );


        if (
            !Number.isFinite(weeklyBudget) ||
            weeklyBudget <= 0
        ) {

            updateText(
                budgetRemainingElement,
                "Not available"
            );

            updateText(
                budgetPercentageElement,
                "—"
            );

            updateText(
                budgetProgressText,
                "Set a valid weekly budget to track your spending."
            );

            updateProgressBar(0);

            return;

        }


        const remainingBudget =
            weeklyBudget - estimatedSpend;


        updateText(
            budgetRemainingElement,
            formatMoney(remainingBudget)
        );


        const percentage =
            (estimatedSpend / weeklyBudget) * 100;

        const displayPercentage =
            Math.round(percentage);


        updateText(
            budgetPercentageElement,
            `${displayPercentage}%`
        );


        updateProgressBar(
            Math.min(displayPercentage, 100)
        );


        if (percentage > 100) {

            updateText(
                budgetProgressText,
                `Your planned meals are approximately ${formatMoney(
                    Math.abs(remainingBudget)
                )} over budget.`
            );

        } else if (percentage === 100) {

            updateText(
                budgetProgressText,
                "You have used your entire weekly budget."
            );

        } else {

            updateText(
                budgetProgressText,
                `${formatMoney(remainingBudget)} remains in your weekly budget.`
            );

        }

    }


    // ========================================================
    // 11. UPDATE BUDGET PROGRESS BAR
    // ========================================================

    function updateProgressBar(percentage) {

        if (!budgetProgressFill || !budgetProgressTrack) {
            return;
        }


        const safePercentage = Math.max(
            0,
            Math.min(Number(percentage) || 0, 100)
        );


        budgetProgressFill.style.width =
            `${safePercentage}%`;


        budgetProgressTrack.setAttribute(
            "aria-valuenow",
            String(safePercentage)
        );


        if (safePercentage >= 100) {

            budgetProgressFill.style.backgroundColor =
                "#c43d3d";

        } else {

            budgetProgressFill.style.backgroundColor = "";

        }

    }


    // ========================================================
    // 12. DISPLAY CURRENT WEEK
    // ========================================================

    function displayCurrentWeek() {

        if (!currentWeekLabel) {
            return;
        }


        const today = new Date();

        const dayOfWeek = today.getDay();

        const daysFromMonday =
            (dayOfWeek + 6) % 7;


        const monday = new Date(today);

        monday.setDate(
            today.getDate() - daysFromMonday
        );


        const sunday = new Date(monday);

        sunday.setDate(
            monday.getDate() + 6
        );


        const dateFormatter = new Intl.DateTimeFormat(
            "en-ZA",
            {
                day: "numeric",
                month: "short"
            }
        );


        updateText(
            currentWeekLabel,
            `${dateFormatter.format(monday)} – ${dateFormatter.format(sunday)}`
        );

    }


    // ========================================================
    // 13. GET RECIPE OBJECT FROM A MEAL
    // ========================================================

    function getRecipeFromMeal(meal) {

        if (!meal || typeof meal !== "object") {
            return {};
        }


        // The current backend nests recipe details here.
        if (
            meal.recipe &&
            typeof meal.recipe === "object"
        ) {

            return meal.recipe;

        }


        // Support older formats where recipe fields
        // were returned directly on the meal object.
        return meal;

    }


    // ========================================================
    // 14. NORMALISE A FLAT WEEKLY MEAL PLAN
    // ========================================================

    function groupMealsByDay(meals) {

        const groupedMeals = new Map();


        meals.forEach(function (meal) {

            if (!meal || typeof meal !== "object") {
                return;
            }


            const dayName =
                meal.day ||
                meal.dayName ||
                "Unscheduled";


            if (!groupedMeals.has(dayName)) {

                groupedMeals.set(
                    dayName,
                    []
                );

            }


            groupedMeals.get(dayName).push(meal);

        });


        const orderedDays = Array.from(
            groupedMeals.entries()
        ).sort(function (first, second) {

            const firstIndex =
                DAYS_OF_WEEK.indexOf(first[0]);

            const secondIndex =
                DAYS_OF_WEEK.indexOf(second[0]);


            if (firstIndex === -1 && secondIndex === -1) {
                return 0;
            }

            if (firstIndex === -1) {
                return 1;
            }

            if (secondIndex === -1) {
                return -1;
            }

            return firstIndex - secondIndex;

        });


        return orderedDays.map(
            function ([name, dayMeals]) {

                return {
                    name,
                    meals: dayMeals
                };

            }
        );

    }


    // ========================================================
    // 15. NORMALISE MEAL PLAN DATA
    // ========================================================

    function getPlanDays(plan) {

        if (!plan || typeof plan !== "object") {
            return [];
        }


        // CURRENT BACKEND FORMAT:
        //
        // mealPlan: [
        //   {
        //     day: "Monday",
        //     mealType: "Dinner",
        //     recipe: {...},
        //     portions: {...}
        //   }
        // ]

        if (Array.isArray(plan.mealPlan)) {

            return groupMealsByDay(
                plan.mealPlan
            );

        }


        // Support flat meal arrays.
        if (Array.isArray(plan.meals)) {

            return groupMealsByDay(
                plan.meals
            );

        }


        const source =
            plan.days ||
            plan.weeklyPlan ||
            plan.schedule;


        // Support day arrays.
        if (Array.isArray(source)) {

            // Some older plans store meal entries directly
            // rather than wrapping them in day objects.
            if (
                source.length > 0 &&
                !Array.isArray(source[0].meals) &&
                (
                    source[0].recipe ||
                    source[0].mealType
                )
            ) {

                return groupMealsByDay(source);

            }


            return source.map(function (day, index) {

                return {

                    name:
                        day.day ||
                        day.dayName ||
                        day.name ||
                        `Day ${index + 1}`,

                    meals: Array.isArray(day.meals)
                        ? day.meals
                        : []

                };

            });

        }


        // Support object-based weekday schedules.
        if (
            source &&
            typeof source === "object"
        ) {

            return Object.entries(source).map(
                function ([day, meals]) {

                    return {

                        name: day,

                        meals: Array.isArray(meals)
                            ? meals
                            : []

                    };

                }
            );

        }


        return [];

    }


    // ========================================================
    // 16. VALIDATE RECIPE IMAGE URLS
    // ========================================================

    function getSafeImageURL(imageURL) {

        if (
            typeof imageURL !== "string" ||
            !imageURL.trim()
        ) {

            return null;

        }


        try {

            const parsedURL = new URL(
                imageURL,
                window.location.href
            );


            if (
                parsedURL.protocol !== "https:" &&
                parsedURL.protocol !== "http:"
            ) {

                return null;

            }


            return parsedURL.href;

        } catch (error) {

            return null;

        }

    }


    // ========================================================
    // 17. CREATE RECIPE PHOTOGRAPH
    // ========================================================

    function createRecipeImage(recipe) {

        const image = document.createElement("img");

        image.className = "meal-entry-image";

        image.alt =
            `Photograph of ${recipe.name || "this recipe"}`;


        image.loading = "lazy";

        image.decoding = "async";

        image.style.display = "block";

        image.style.width = "100%";

        image.style.height = "190px";

        image.style.objectFit = "cover";

        image.style.objectPosition = "center";

        image.style.borderRadius = "10px";


        // Use the actual photograph supplied by TheMealDB.
        const imageURL = getSafeImageURL(
            recipe.image ||
            recipe.thumbnail ||
            recipe.imageUrl
        );


        if (imageURL) {

            image.src = imageURL;

        } else {

            image.dataset.usingFallback = "true";

            image.src = RECIPE_PLACEHOLDER;

        }


        // If the original photograph cannot load,
        // display the application's local placeholder.
        image.addEventListener("error", function () {

            if (image.dataset.usingFallback !== "true") {

                image.dataset.usingFallback = "true";

                image.src = RECIPE_PLACEHOLDER;

                return;

            }


            // Avoid endlessly retrying a missing placeholder.
            image.hidden = true;

        });


        return image;

    }


    // ========================================================
    // 18. FORMAT RECIPE INGREDIENTS
    // ========================================================

    function getIngredientText(ingredient) {

        if (typeof ingredient === "string") {

            return ingredient;

        }


        if (
            !ingredient ||
            typeof ingredient !== "object"
        ) {

            return "";

        }


        const name =
            ingredient.name ||
            ingredient.ingredient ||
            ingredient.item ||
            "";


        const measure =
            ingredient.measure ||
            ingredient.quantity ||
            "";


        return [
            measure,
            name
        ].filter(Boolean).join(" ");

    }


    // ========================================================
    // 19. CREATE INGREDIENT DETAILS
    // ========================================================

    function createIngredientDetails(ingredients) {

        if (
            !Array.isArray(ingredients) ||
            ingredients.length === 0
        ) {

            return null;

        }


        const details = document.createElement("details");

        details.className = "meal-entry-details";


        const summary = document.createElement("summary");

        summary.textContent =
            `View ingredients (${ingredients.length})`;


        const list = document.createElement("ul");


        ingredients.forEach(function (ingredient) {

            const ingredientText =
                getIngredientText(ingredient);


            if (!ingredientText) {
                return;
            }


            const item = document.createElement("li");

            item.textContent = ingredientText;

            list.appendChild(item);

        });


        details.append(summary, list);

        return details;

    }


    // ========================================================
    // 20. CREATE COOKING INSTRUCTIONS
    // ========================================================

    function createInstructionDetails(recipe) {

        if (
            typeof recipe.instructions !== "string" ||
            !recipe.instructions.trim()
        ) {

            return null;

        }


        const details = document.createElement("details");

        details.className = "meal-entry-details";


        const summary = document.createElement("summary");

        summary.textContent = "Cooking instructions";


        const instructions = document.createElement("p");

        instructions.textContent =
            recipe.instructions.trim();


        details.append(summary, instructions);

        return details;

    }


    // ========================================================
    // 21. CREATE A MEAL ENTRY WITH A REAL RECIPE IMAGE
    // ========================================================

    function createMealEntry(meal) {

        const recipe =
            getRecipeFromMeal(meal);


        const entry = document.createElement("article");

        entry.className = "meal-entry meal-recipe-card";

        entry.style.overflow = "hidden";


        // ----------------------------------------------------
        // A. RECIPE IMAGE
        // ----------------------------------------------------

        const image = createRecipeImage(recipe);

        entry.appendChild(image);


        // ----------------------------------------------------
        // B. RECIPE CONTENT
        // ----------------------------------------------------

        const content = document.createElement("div");

        content.className = "meal-entry-content";

        content.style.paddingTop = "12px";


        // ----------------------------------------------------
        // C. RECIPE NAME
        // ----------------------------------------------------

        const title = document.createElement("h4");

        title.textContent =
            recipe.name ||
            meal.recipeName ||
            meal.name ||
            meal.title ||
            "Untitled recipe";


        content.appendChild(title);


        // ----------------------------------------------------
        // D. MEAL CATEGORY AND AVAILABLE DETAILS
        // ----------------------------------------------------

        const details = document.createElement("p");

        details.className = "meal-entry-meta";


        const mealType =
            meal.mealType ||
            meal.type ||
            recipe.mealType ||
            "Meal";


        const category =
            recipe.category ||
            meal.category ||
            "";


        const detailParts = [mealType];


        if (
            category &&
            category.toLowerCase() !== mealType.toLowerCase()
        ) {

            detailParts.push(category);

        }


        const time =
            recipe.totalTime ??
            meal.totalTime ??
            recipe.cookingTime ??
            meal.cookingTime;


        if (
            time !== undefined &&
            time !== null &&
            Number.isFinite(Number(time))
        ) {

            detailParts.push(
                `${Number(time)} minutes`
            );

        }


        details.textContent =
            detailParts.join(" · ");


        content.appendChild(details);


        // ----------------------------------------------------
        // E. RECIPE DESCRIPTION
        // ----------------------------------------------------

        if (
            typeof recipe.description === "string" &&
            recipe.description.trim()
        ) {

            const description =
                document.createElement("p");

            description.className =
                "meal-entry-description";

            description.textContent =
                recipe.description.trim();

            content.appendChild(description);

        }


        // ----------------------------------------------------
        // F. HOUSEHOLD PORTION INFORMATION
        // ----------------------------------------------------

        const portions =
            meal.portions ||
            meal.householdPortions ||
            null;


        if (
            portions &&
            Number.isFinite(
                Number(portions.totalHouseholdServings)
            )
        ) {

            const portionText =
                document.createElement("p");

            portionText.className =
                "meal-entry-portions";

            portionText.textContent =
                `Household servings: ${portions.totalHouseholdServings}`;


            content.appendChild(portionText);

        }


        // ----------------------------------------------------
        // G. RECIPE COST
        // ----------------------------------------------------

        const costValue =
            meal.cost ??
            recipe.estimatedCost ??
            null;


        const costText =
            document.createElement("p");

        costText.className = "meal-entry-cost";


        if (
            costValue !== null &&
            costValue !== undefined &&
            costValue !== "" &&
            Number.isFinite(Number(costValue))
        ) {

            costText.textContent =
                formatMoney(Number(costValue));

        } else {

            costText.textContent =
                "Price currently unavailable";

        }


        content.appendChild(costText);


        // ----------------------------------------------------
        // H. INGREDIENTS
        // ----------------------------------------------------

        const ingredients =
            Array.isArray(recipe.ingredients)
                ? recipe.ingredients
                : Array.isArray(meal.ingredients)
                    ? meal.ingredients
                    : [];


        const ingredientDetails =
            createIngredientDetails(ingredients);


        if (ingredientDetails) {

            content.appendChild(ingredientDetails);

        }


        // ----------------------------------------------------
        // I. COOKING INSTRUCTIONS
        // ----------------------------------------------------

        const instructionDetails =
            createInstructionDetails(recipe);


        if (instructionDetails) {

            content.appendChild(instructionDetails);

        }


        // ----------------------------------------------------
        // J. SOURCE LINK
        // ----------------------------------------------------

        const sourceURL = getSafeImageURL(
            recipe.sourceUrl ||
            recipe.sourceURL ||
            meal.sourceUrl
        );


        if (sourceURL) {

            const sourceLink =
                document.createElement("a");

            sourceLink.href = sourceURL;

            sourceLink.target = "_blank";

            sourceLink.rel =
                "noopener noreferrer";

            sourceLink.textContent =
                "View original recipe";

            sourceLink.className =
                "meal-entry-source";


            content.appendChild(sourceLink);

        }


        entry.appendChild(content);

        return entry;

    }


    // ========================================================
    // 22. CREATE A DAY CARD
    // ========================================================

    function createDayCard(day) {

        const card = document.createElement("article");

        card.className = "meal-day-card";


        const heading =
            document.createElement("h3");

        heading.textContent = day.name;


        card.appendChild(heading);


        if (
            !Array.isArray(day.meals) ||
            day.meals.length === 0
        ) {

            const emptyText =
                document.createElement("p");

            emptyText.textContent =
                "No meals added for this day.";

            card.appendChild(emptyText);

            return card;

        }


        day.meals.forEach(function (meal) {

            card.appendChild(
                createMealEntry(meal)
            );

        });


        return card;

    }


    // ========================================================
    // 23. DISPLAY SELECTED RECIPES WITHOUT DAY ASSIGNMENTS
    // ========================================================

    function displaySelectedRecipes(plan) {

        const selectedRecipes =
            Array.isArray(plan.selectedRecipes)
                ? plan.selectedRecipes
                : [];


        if (selectedRecipes.length === 0) {
            return false;
        }


        const card = document.createElement("article");

        card.className = "meal-day-card";


        const heading =
            document.createElement("h3");

        heading.textContent =
            "Meals you've selected";


        const description =
            document.createElement("p");

        description.textContent =
            "These recipes have been added to your meal plan.";


        card.append(heading, description);


        selectedRecipes.forEach(function (recipe) {

            card.appendChild(
                createMealEntry(recipe)
            );

        });


        mealPlanContainer.appendChild(card);

        return true;

    }


    // ========================================================
    // 24. UPDATE EMPTY STATE MESSAGE
    // ========================================================

    function updateEmptyStateMessage(message) {

        if (!dashboardEmptyState) {
            return;
        }


        const paragraph =
            dashboardEmptyState.querySelector("p");


        if (paragraph && message) {

            paragraph.textContent = message;

        }

    }


    // ========================================================
    // 25. LOAD AND DISPLAY THE WEEKLY MEAL PLAN
    // ========================================================

    function loadWeeklyMealPlan() {

        const plan =
            window.MealMateStorage.getMealPlan();


        mealPlanContainer.replaceChildren();


        if (!plan) {

            updateEmptyStateMessage(
                "Complete your household questionnaire and generate your first personalised weekly meal plan."
            );


            if (dashboardEmptyState) {
                dashboardEmptyState.classList.remove("hidden");
            }

            return;

        }


        const days = getPlanDays(plan);

        let hasMeals = false;


        // Display meals grouped by their scheduled day.
        if (days.length > 0) {

            days.forEach(function (day) {

                if (
                    Array.isArray(day.meals) &&
                    day.meals.length > 0
                ) {

                    hasMeals = true;

                }


                mealPlanContainer.appendChild(
                    createDayCard(day)
                );

            });

        }


        // Support recipes selected outside the weekly schedule.
        if (!hasMeals) {

            mealPlanContainer.replaceChildren();


            const displayedSelectedRecipes =
                displaySelectedRecipes(plan);


            if (!displayedSelectedRecipes) {

                const message =
                    plan.message ||
                    "No meal recommendations are available yet. Try generating a new meal plan or adjusting your preferences.";


                updateEmptyStateMessage(message);


                if (dashboardEmptyState) {
                    dashboardEmptyState.classList.remove("hidden");
                }

                return;

            }

        }


        if (dashboardEmptyState) {
            dashboardEmptyState.classList.add("hidden");
        }

    }


    // ========================================================
    // 26. CREATE A DASHBOARD MESSAGE
    // ========================================================

    function showDashboardMessage(
        message,
        type = "success"
    ) {

        let messageElement =
            document.getElementById("dashboardPlanMessage");


        if (!messageElement) {

            messageElement =
                document.createElement("div");

            messageElement.id =
                "dashboardPlanMessage";

            messageElement.className =
                "form-message";

            messageElement.setAttribute(
                "role",
                "status"
            );

            messageElement.setAttribute(
                "aria-live",
                "polite"
            );


            if (mealPlanContainer) {

                mealPlanContainer.before(
                    messageElement
                );

            }

        }


        messageElement.textContent = message;


        messageElement.classList.remove(
            "hidden",
            "success-message",
            "error-message",
            "warning-note"
        );


        if (type === "error") {

            messageElement.classList.add(
                "error-message"
            );

            messageElement.setAttribute(
                "role",
                "alert"
            );

        } else if (type === "warning") {

            messageElement.classList.add(
                "warning-note"
            );

            messageElement.setAttribute(
                "role",
                "status"
            );

        } else {

            messageElement.classList.add(
                "success-message"
            );

            messageElement.setAttribute(
                "role",
                "status"
            );

        }

    }


    // ========================================================
    // 27. EXTRACT GENERATED MEAL PLAN FROM API RESPONSE
    // ========================================================

    function extractGeneratedPlan(response) {

        if (
            !response ||
            typeof response !== "object"
        ) {

            return null;

        }


        if (response.success === false) {

            throw new Error(
                response.message ||
                "The backend could not generate a meal plan."
            );

        }


        let plan = response;


        // Support APIs that wrap their response in data.
        if (
            response.data &&
            typeof response.data === "object"
        ) {

            plan = response.data;

        }


        // Current backend response:
        // {
        //   success: true,
        //   message: "...",
        //   mealPlan: [...]
        // }
        //
        // An empty mealPlan is also a valid response
        // when no suitable recipes are found.

        if (Array.isArray(plan.mealPlan)) {

            return plan;

        }


        // Support direct plan responses.
        if (Array.isArray(plan)) {

            return {
                mealPlan: plan
            };

        }


        if (Array.isArray(plan.selectedRecipes)) {

            return plan;

        }


        if (
            Array.isArray(plan.days) ||
            Array.isArray(plan.weeklyPlan) ||
            Array.isArray(plan.meals) ||
            (
                plan.schedule &&
                typeof plan.schedule === "object"
            )
        ) {

            return plan;

        }


        return null;

    }


    // ========================================================
    // 28. GENERATE A PERSONALISED MEAL PLAN
    // ========================================================

    async function handleGenerateMealPlan() {

        const preferences =
            window.MealMateStorage.getPreferences();


        if (!preferences) {

            showDashboardMessage(
                "Please complete your household questionnaire before generating a meal plan.",
                "error"
            );

            return;

        }


        if (!window.MealMateAPI) {

            showDashboardMessage(
                "The backend connection is not available yet.",
                "error"
            );

            return;

        }


        if (!generateMealPlanButton) {
            return;
        }


        const originalButtonText =
            generateMealPlanButton.textContent;


        generateMealPlanButton.disabled = true;

        generateMealPlanButton.textContent =
            "Fetching recipes and building your meal plan...";


        try {

            // Send household preferences to the backend.
            const response =
                await window.MealMateAPI.generateMealPlan(
                    preferences
                );


            // Extract the actual meal plan.
            const generatedPlan =
                extractGeneratedPlan(response);


            if (!generatedPlan) {

                throw new Error(
                    "The backend returned an invalid meal plan. Please try again."
                );

            }


            // Preserve existing selected recipes when the
            // backend does not provide a selectedRecipes array.
            const existingPlan =
                window.MealMateStorage.getMealPlan();


            if (
                existingPlan &&
                !generatedPlan.selectedRecipes &&
                Array.isArray(existingPlan.selectedRecipes)
            ) {

                generatedPlan.selectedRecipes =
                    existingPlan.selectedRecipes;

            }


            generatedPlan.generatedAt =
                new Date().toISOString();


            // Save the generated plan.
            const saved =
                window.MealMateStorage.saveMealPlan(
                    generatedPlan
                );


            if (!saved) {

                throw new Error(
                    "The new meal plan could not be saved."
                );

            }


            // Record user activity.
            window.MealMateStorage.addActivity(
                "A new weekly meal plan was generated",
                "meal-plan"
            );


            // Refresh dashboard sections.
            loadWeeklyMealPlan();

            loadBudgetInformation();

            loadRecentActivity();


            // Display different messages for empty and successful plans.
            const generatedMeals =
                getMealEntries(generatedPlan);


            if (generatedMeals.length === 0) {

                showDashboardMessage(
                    generatedPlan.message ||
                    "No suitable recipes were found. Try adjusting your household preferences.",
                    "warning"
                );

            } else {

                showDashboardMessage(
                    `Your personalised meal plan is ready! ${generatedMeals.length} meal recommendations were added.`,
                    "success"
                );

            }


        } catch (error) {

            console.error(
                "Meal plan generation failed:",
                error
            );


            showDashboardMessage(
                error.message ||
                "We couldn't generate your meal plan. Please try again.",
                "error"
            );

        } finally {

            generateMealPlanButton.disabled = false;

            generateMealPlanButton.textContent =
                originalButtonText;

        }

    }


    // ========================================================
    // 29. LOAD RECENT ACTIVITIES
    // ========================================================

    function loadRecentActivity() {

        if (!recentActivityElement) {
            return;
        }


        const activities =
            window.MealMateStorage.getActivities();


        recentActivityElement.replaceChildren();


        if (activities.length === 0) {

            const empty =
                document.createElement("div");

            empty.className =
                "activity-empty";


            const icon =
                document.createElement("span");

            icon.setAttribute(
                "aria-hidden",
                "true"
            );

            icon.textContent = "📝";


            const paragraph =
                document.createElement("p");

            paragraph.textContent =
                "Your recent meal-planning activities will appear here.";


            empty.append(icon, paragraph);

            recentActivityElement.appendChild(empty);

            return;

        }


        activities.forEach(function (activity) {

            const item =
                document.createElement("div");

            item.className =
                "activity-item";


            const icon =
                document.createElement("span");

            icon.setAttribute(
                "aria-hidden",
                "true"
            );

            icon.textContent =
                getActivityIcon(activity.type);


            const content =
                document.createElement("div");


            const message =
                document.createElement("p");

            message.textContent =
                activity.message;


            const date =
                document.createElement("small");

            date.textContent =
                window.MealMateApp.formatDate(
                    activity.createdAt
                );


            content.append(message, date);

            item.append(icon, content);

            recentActivityElement.appendChild(item);

        });

    }


    // ========================================================
    // 30. ACTIVITY ICONS
    // ========================================================

    function getActivityIcon(type) {

        const icons = {

            preferences: "⚙️",

            favourite: "❤️",

            "meal-plan": "🍽️",

            shopping: "🛒",

            pantry: "🏡",

            general: "📝"

        };


        return icons[type] || "📝";

    }


    // ========================================================
    // 31. REFRESH DASHBOARD DATA
    // ========================================================

    function refreshDashboard() {

        loadHouseholdOverview();

        loadBudgetInformation();

        loadWeeklyMealPlan();

        loadRecentActivity();

    }


    // ========================================================
    // 32. INITIALIZE
    // ========================================================

    initializeDashboard();


    // Refresh dashboard when the browser tab becomes active.
    document.addEventListener(
        "visibilitychange",
        function () {

            if (!document.hidden) {
                refreshDashboard();
            }

        }
    );


})();

// ============================================================
// END OF DASHBOARD.JS
// ============================================================
