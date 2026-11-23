// ============================================================
// MEALMATE SA
// Dashboard Management
// File: public/js/dashboard.js
// ============================================================

"use strict";

(function () {

    // ========================================================
    // 1. GET DASHBOARD ELEMENTS
    // ========================================================

    const householdSizeElement = document.getElementById("householdSize");
    const householdBreakdownElement = document.getElementById(
        "householdBreakdown"
    );

    const dietaryPreferenceElement = document.getElementById(
        "dietaryPreference"
    );

    const preferredRetailerElement = document.getElementById(
        "preferredRetailer"
    );

    const shoppingLocationElement = document.getElementById(
        "shoppingLocation"
    );

    const weeklyBudgetElement = document.getElementById(
        "weeklyBudgetValue"
    );

    const estimatedSpendElement = document.getElementById(
        "estimatedSpend"
    );

    const budgetRemainingElement = document.getElementById(
        "budgetRemaining"
    );

    const budgetProgressText = document.getElementById(
        "budgetProgressText"
    );

    const budgetPercentageElement = document.getElementById(
        "budgetPercentage"
    );

    const budgetProgressFill = document.getElementById(
        "budgetProgressFill"
    );

    const budgetProgressTrack = document.getElementById(
        "budgetProgressTrack"
    );

    const currentWeekLabel = document.getElementById(
        "currentWeekLabel"
    );

    const mealPlanContainer = document.getElementById(
        "mealPlanContainer"
    );

    const dashboardEmptyState = document.getElementById(
        "dashboardEmptyState"
    );

    const generateMealPlanButton = document.getElementById(
        "generateMealPlanButton"
    );

    const recentActivityElement = document.getElementById(
        "recentActivity"
    );


    // ========================================================
    // 2. CHECK REQUIRED DEPENDENCIES
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


    // ========================================================
    // 3. INITIALIZE DASHBOARD
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

        console.log("MealMate SA dashboard initialized.");

    }


    // ========================================================
    // 4. REUSABLE TEXT UPDATE FUNCTION
    // ========================================================

    function updateText(element, value) {

        if (!element) {
            return;
        }

        element.textContent = value;

    }


    // ========================================================
    // 5. FORMAT CURRENCY
    // ========================================================

    function formatMoney(amount) {

        return window.MealMateApp.formatCurrency(amount);

    }


    // ========================================================
    // 6. LOAD HOUSEHOLD OVERVIEW
    // ========================================================

    function loadHouseholdOverview() {

        const preferences = window.MealMateStorage.getPreferences();

        if (!preferences) {

            updateText(householdSizeElement, "Not set");

            updateText(
                householdBreakdownElement,
                "Complete your questionnaire"
            );

            updateText(dietaryPreferenceElement, "Not set");

            updateText(preferredRetailerElement, "Not set");

            updateText(
                shoppingLocationElement,
                "Shopping location not set"
            );

            return;

        }


        const adults = Number(preferences.adultCount) || 0;

        const children = Number(preferences.childCount) || 0;

        const totalMembers =
            adults + children;


        // Household size.
        updateText(
            householdSizeElement,
            `${totalMembers} ${totalMembers === 1 ? "member" : "members"}`
        );


        // Household breakdown.
        updateText(
            householdBreakdownElement,
            `${adults} ${adults === 1 ? "adult" : "adults"} and ` +
            `${children} ${children === 1 ? "child" : "children"}`
        );


        // Dietary preference.
        updateText(
            dietaryPreferenceElement,
            preferences.diet || "Not specified"
        );


        // Preferred retailer.
        updateText(
            preferredRetailerElement,
            preferences.retailer || "Not set"
        );


        // Shopping location.
        updateText(
            shoppingLocationElement,
            preferences.shoppingLocation || "Location not set"
        );

    }


    // ========================================================
    // 7. FIND THE ESTIMATED COST OF A MEAL PLAN
    // ========================================================

    function getEstimatedPlanCost(plan) {

        if (!plan || typeof plan !== "object") {
            return null;
        }


        // Check for a total estimated cost supplied by the backend.
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


        // Otherwise calculate the total from individually priced recipes.
        const recipes = Array.isArray(plan.selectedRecipes)
            ? plan.selectedRecipes
            : [];


        if (recipes.length > 0) {

            let total = 0;

            for (const recipe of recipes) {

                const cost = Number(recipe.estimatedCost);

                if (
                    recipe.estimatedCost === null ||
                    recipe.estimatedCost === undefined ||
                    recipe.estimatedCost === "" ||
                    !Number.isFinite(cost) ||
                    cost < 0
                ) {
                    return null;
                }

                total += cost;

            }

            return total;

        }


        return null;

    }


    // ========================================================
    // 8. LOAD WEEKLY BUDGET INFORMATION
    // ========================================================

    function loadBudgetInformation() {

        const preferences = window.MealMateStorage.getPreferences();

        const mealPlan = window.MealMateStorage.getMealPlan();


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


        const weeklyBudget = Number(preferences.weeklyBudget);


        // Display weekly budget.
        if (
            !Number.isFinite(weeklyBudget) ||
            weeklyBudget <= 0
        ) {

            updateText(weeklyBudgetElement, "Not set");

        } else {

            updateText(
                weeklyBudgetElement,
                formatMoney(weeklyBudget)
            );

        }


        // Get the estimated meal plan cost.
        const estimatedSpend = getEstimatedPlanCost(mealPlan);


        if (estimatedSpend === null) {

            updateText(estimatedSpendElement, "Not available");

            updateText(budgetRemainingElement, "Not available");

            updateText(budgetPercentageElement, "—");

            updateText(
                budgetProgressText,
                "Cost estimates will appear when recipe price information is available."
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

            updateText(budgetRemainingElement, "Not available");

            updateText(budgetPercentageElement, "—");

            updateText(
                budgetProgressText,
                "Set a valid weekly budget to track your spending."
            );

            updateProgressBar(0);

            return;

        }


        // Calculate the remaining budget.
        const remainingBudget = weeklyBudget - estimatedSpend;


        updateText(
            budgetRemainingElement,
            formatMoney(remainingBudget)
        );


        // Calculate the percentage of the budget used.
        const percentage = (estimatedSpend / weeklyBudget) * 100;

        const displayPercentage = Math.round(percentage);


        updateText(
            budgetPercentageElement,
            `${displayPercentage}%`
        );


        updateProgressBar(Math.min(displayPercentage, 100));


        // Update the progress description.
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
    // 9. UPDATE BUDGET PROGRESS BAR
    // ========================================================

    function updateProgressBar(percentage) {

        if (!budgetProgressFill || !budgetProgressTrack) {
            return;
        }

        const safePercentage = Math.max(
            0,
            Math.min(Number(percentage) || 0, 100)
        );


        budgetProgressFill.style.width = `${safePercentage}%`;


        budgetProgressTrack.setAttribute(
            "aria-valuenow",
            String(safePercentage)
        );


        // Visually indicate when the budget is exceeded.
        if (safePercentage >= 100) {

            budgetProgressFill.style.backgroundColor = "#c43d3d";

        } else {

            budgetProgressFill.style.backgroundColor = "";

        }

    }


    // ========================================================
    // 10. DISPLAY THE CURRENT WEEK
    // ========================================================

    function displayCurrentWeek() {

        if (!currentWeekLabel) {
            return;
        }

        const today = new Date();

        const dayOfWeek = today.getDay();

        // JavaScript Sunday = 0.
        // Convert the date to Monday.
        const daysFromMonday = (dayOfWeek + 6) % 7;

        const monday = new Date(today);

        monday.setDate(
            today.getDate() - daysFromMonday
        );

        const sunday = new Date(monday);

        sunday.setDate(monday.getDate() + 6);


        const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
            day: "numeric",
            month: "short"
        });


        updateText(
            currentWeekLabel,
            `${dateFormatter.format(monday)} – ${dateFormatter.format(sunday)}`
        );

    }


    // ========================================================
    // 11. NORMALISE MEAL PLAN DATA
    // ========================================================

    function getPlanDays(plan) {

        if (!plan || typeof plan !== "object") {
            return [];
        }

        const source = plan.days || plan.weeklyPlan || plan.schedule;


        // The backend may provide days as an array.
        if (Array.isArray(source)) {

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


        // Or it may provide an object with weekday names as keys.
        if (source && typeof source === "object") {

            return Object.entries(source).map(function ([day, meals]) {

                return {

                    name: day,

                    meals: Array.isArray(meals)
                        ? meals
                        : []

                };

            });

        }


        // Support plans that have a meals array with day properties.
        if (Array.isArray(plan.meals)) {

            const groupedMeals = new Map();

            plan.meals.forEach(function (meal) {

                const day = meal.day || meal.dayName || "Unscheduled";

                if (!groupedMeals.has(day)) {
                    groupedMeals.set(day, []);
                }

                groupedMeals.get(day).push(meal);

            });


            return Array.from(groupedMeals.entries()).map(
                function ([day, meals]) {

                    return {
                        name: day,
                        meals: meals
                    };

                }
            );

        }


        return [];

    }


    // ========================================================
    // 12. CREATE A MEAL ENTRY
    // ========================================================

    function createMealEntry(meal) {

        const entry = document.createElement("div");

        entry.className = "meal-entry";


        const title = document.createElement("h4");

        title.textContent =
            meal.name ||
            meal.recipeName ||
            meal.title ||
            "Untitled meal";


        const details = document.createElement("p");

        const category = meal.category || meal.type || "Meal";

        const time = meal.totalTime ?? meal.cookingTime;

        let detailText = category;

        if (
            time !== undefined &&
            time !== null &&
            Number.isFinite(Number(time))
        ) {
            detailText += ` · ${time} minutes`;
        }

        if (
            meal.estimatedCost !== undefined &&
            meal.estimatedCost !== null &&
            Number.isFinite(Number(meal.estimatedCost))
        ) {
            detailText += ` · ${formatMoney(Number(meal.estimatedCost))}`;
        }


        details.textContent = detailText;

        entry.append(title, details);

        return entry;

    }


    // ========================================================
    // 13. CREATE A DAY CARD
    // ========================================================

    function createDayCard(day) {

        const card = document.createElement("article");

        card.className = "meal-day-card";


        const heading = document.createElement("h3");

        heading.textContent = day.name;


        card.appendChild(heading);


        if (!day.meals || day.meals.length === 0) {

            const emptyText = document.createElement("p");

            emptyText.textContent = "No meals added for this day.";

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
    // 14. DISPLAY SELECTED RECIPES WITHOUT DAY ASSIGNMENTS
    // ========================================================

    function displaySelectedRecipes(plan) {

        const selectedRecipes = Array.isArray(plan.selectedRecipes)
            ? plan.selectedRecipes
            : [];


        if (selectedRecipes.length === 0) {
            return false;
        }


        const card = document.createElement("article");

        card.className = "meal-day-card";


        const heading = document.createElement("h3");

        heading.textContent = "Meals you've selected";


        const description = document.createElement("p");

        description.textContent =
            "These recipes have been added to your meal plan. " +
            "They have not yet been assigned to specific days.";


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
    // 15. LOAD AND DISPLAY THE WEEKLY MEAL PLAN
    // ========================================================

    function loadWeeklyMealPlan() {

        const plan = window.MealMateStorage.getMealPlan();


        mealPlanContainer.replaceChildren();


        if (!plan) {

            dashboardEmptyState.classList.remove("hidden");

            return;

        }


        const days = getPlanDays(plan);

        let hasMeals = false;


        // Display daily meal cards when available.
        if (days.length > 0) {

            days.forEach(function (day) {

                mealPlanContainer.appendChild(
                    createDayCard(day)
                );

                if (day.meals.length > 0) {
                    hasMeals = true;
                }

            });

        }


        // If recipes have only been selected but not scheduled,
        // display them without pretending that they have assigned days.
        if (!hasMeals) {

            mealPlanContainer.replaceChildren();

            const displayedSelectedRecipes =
                displaySelectedRecipes(plan);

            if (!displayedSelectedRecipes) {

                dashboardEmptyState.classList.remove("hidden");

                return;

            }

        }


        dashboardEmptyState.classList.add("hidden");

    }


    // ========================================================
    // 16. CREATE A DASHBOARD MESSAGE
    // ========================================================

    function showDashboardMessage(message, type = "success") {

        let messageElement = document.getElementById(
            "dashboardPlanMessage"
        );


        // Create the message element when it doesn't exist.
        if (!messageElement) {

            messageElement = document.createElement("div");

            messageElement.id = "dashboardPlanMessage";

            messageElement.className = "form-message";

            messageElement.setAttribute("role", "status");

            messageElement.setAttribute("aria-live", "polite");


            if (mealPlanContainer) {

                mealPlanContainer.before(messageElement);

            }

        }


        messageElement.textContent = message;

        messageElement.classList.remove(
            "hidden",
            "success-message",
            "error-message"
        );

        messageElement.classList.add(
            type === "error"
                ? "error-message"
                : "success-message"
        );

        messageElement.setAttribute(
            "role",
            type === "error" ? "alert" : "status"
        );

    }


    // ========================================================
    // 17. EXTRACT GENERATED MEAL PLAN FROM API RESPONSE
    // ========================================================

    function extractGeneratedPlan(response) {

        if (!response || typeof response !== "object") {
            return null;
        }

        let plan =
            response.mealPlan ||
            response.plan ||
            response.data?.mealPlan ||
            response.data?.plan ||
            response.data ||
            response;


        // Convert an array of daily plans into a plan object.
        if (Array.isArray(plan)) {

            plan = {
                days: plan
            };

        }


        if (!plan || typeof plan !== "object") {
            return null;
        }


        // Check that the response contains actual meal information.
        const hasSelectedRecipes =
            Array.isArray(plan.selectedRecipes) &&
            plan.selectedRecipes.length > 0;

        const hasDays =
            Array.isArray(plan.days) ||
            (
                plan.days &&
                typeof plan.days === "object"
            ) ||
            Array.isArray(plan.weeklyPlan) ||
            Array.isArray(plan.meals) ||
            (
                plan.schedule &&
                typeof plan.schedule === "object"
            );


        if (!hasSelectedRecipes && !hasDays) {
            return null;
        }


        return plan;

    }


    // ========================================================
    // 18. GENERATE A PERSONALISE​D MEAL PLAN
    // ========================================================

    async function handleGenerateMealPlan() {

        const preferences = window.MealMateStorage.getPreferences();


        // A questionnaire must be completed first.
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


        const originalButtonText =
            generateMealPlanButton.textContent;


        generateMealPlanButton.disabled = true;

        generateMealPlanButton.textContent =
            "Generating your meal plan...";


        try {

            const response =
                await window.MealMateAPI.generateMealPlan(preferences);


            const generatedPlan = extractGeneratedPlan(response);


            if (!generatedPlan) {

                throw new Error(
                    "The backend returned an invalid meal plan. " +
                    "Please try again."
                );

            }


            // Preserve recipes the user previously selected
            // if the backend did not return selectedRecipes.
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


            generatedPlan.generatedAt = new Date().toISOString();


            const saved = window.MealMateStorage.saveMealPlan(
                generatedPlan
            );


            if (!saved) {

                throw new Error(
                    "The new meal plan could not be saved."
                );

            }


            window.MealMateStorage.addActivity(
                "A new weekly meal plan was generated",
                "meal-plan"
            );


            loadWeeklyMealPlan();

            loadBudgetInformation();

            loadRecentActivity();


            showDashboardMessage(
                "Your personalised meal plan has been generated successfully!",
                "success"
            );


        } catch (error) {

            console.error("Meal plan generation failed:", error);


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
    // 19. LOAD RECENT ACTIVITIES
    // ========================================================

    function loadRecentActivity() {

        if (!recentActivityElement) {
            return;
        }


        const activities = window.MealMateStorage.getActivities();


        recentActivityElement.replaceChildren();


        if (activities.length === 0) {

            const empty = document.createElement("div");

            empty.className = "activity-empty";


            const icon = document.createElement("span");

            icon.setAttribute("aria-hidden", "true");

            icon.textContent = "📝";


            const paragraph = document.createElement("p");

            paragraph.textContent =
                "Your recent meal-planning activities will appear here.";


            empty.append(icon, paragraph);

            recentActivityElement.appendChild(empty);

            return;

        }


        activities.forEach(function (activity) {

            const item = document.createElement("div");

            item.className = "activity-item";


            const icon = document.createElement("span");

            icon.setAttribute("aria-hidden", "true");

            icon.textContent = getActivityIcon(activity.type);


            const content = document.createElement("div");


            const message = document.createElement("p");

            message.textContent = activity.message;


            const date = document.createElement("small");

            date.textContent =
                window.MealMateApp.formatDate(activity.createdAt);


            content.append(message, date);

            item.append(icon, content);

            recentActivityElement.appendChild(item);

        });

    }


    // ========================================================
    // 20. ACTIVITY ICONS
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
    // 21. REFRESH DASHBOARD DATA
    // ========================================================

    function refreshDashboard() {

        loadHouseholdOverview();

        loadBudgetInformation();

        loadWeeklyMealPlan();

        loadRecentActivity();

    }


    // ========================================================
    // 22. INITIALIZE
    // ========================================================

    initializeDashboard();


    // Refresh dashboard when the browser tab becomes active again.
    document.addEventListener("visibilitychange", function () {

        if (!document.hidden) {
            refreshDashboard();
        }

    });


})();

// ============================================================
// END OF DASHBOARD.JS
// ============================================================
