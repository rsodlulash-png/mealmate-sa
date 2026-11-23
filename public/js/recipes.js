// ============================================================
// MEALMATE SA
// Recipe Discovery and Management
// File: public/js/recipes.js
// ============================================================

"use strict";


// ============================================================
// 1. GET HTML ELEMENTS
// ============================================================

const recipeSearchForm = document.getElementById("recipeSearchForm");
const recipeSearchInput = document.getElementById("recipeSearch");

const mealCategoryFilter = document.getElementById("mealCategory");
const dietFilter = document.getElementById("dietFilter");
const cookingTimeFilter = document.getElementById("cookingTimeFilter");
const sortRecipesSelect = document.getElementById("sortRecipes");

const recipeGrid = document.getElementById("recipeGrid");
const recipeCardTemplate = document.getElementById("recipeCardTemplate");

const recipeResultCount = document.getElementById("recipeResultCount");
const recipeLoading = document.getElementById("recipeLoading");
const recipeError = document.getElementById("recipeError");
const recipeEmptyState = document.getElementById("recipeEmptyState");

const clearRecipeFiltersButton = document.getElementById("clearRecipeFilters");
const emptyStateClearFiltersButton = document.getElementById(
    "emptyStateClearFilters"
);

const favouriteRecipeGrid = document.getElementById("favouriteRecipeGrid");
const emptyFavourites = document.getElementById("emptyFavourites");

const recipeDialog = document.getElementById("recipeDialog");
const closeRecipeDialogButton = document.getElementById("closeRecipeDialog");

const dialogRecipeTitle = document.getElementById("dialogRecipeTitle");
const dialogRecipeImage = document.getElementById("dialogRecipeImage");
const dialogRecipeDescription = document.getElementById(
    "dialogRecipeDescription"
);

const dialogPrepTime = document.getElementById("dialogPrepTime");
const dialogCookTime = document.getElementById("dialogCookTime");
const dialogRecipeCost = document.getElementById("dialogRecipeCost");
const dialogRecipeServings = document.getElementById("dialogRecipeServings");

const dialogIngredients = document.getElementById("dialogIngredients");
const dialogInstructions = document.getElementById("dialogInstructions");

const dialogFavouriteButton = document.getElementById(
    "dialogFavouriteButton"
);

const addRecipeToPlanButton = document.getElementById(
    "addRecipeToPlanButton"
);

const recipeApiAttribution = document.getElementById(
    "recipeApiAttribution"
);


// ============================================================
// 2. APPLICATION VARIABLES
// ============================================================

let recipes = [];
let currentRecipe = null;
let usingDemoRecipes = false;

const PLACEHOLDER_IMAGE = "images/recipe-placeholder.jpg";

const DEMO_RECIPES = [

    {
        id: "demo-001",

        name: "Pap and Chakalaka",

        category: "Dinner",

        description:
            "A South African-inspired meal featuring soft pap and a flavourful vegetable chakalaka.",

        image: "https://cookit.co.za/assets/recipe-pap-chakalaka-CdMa__MJ.jpg",

        prepTime: 10,
        cookTime: 25,
        totalTime: 35,

        servings: 4,

        ingredients: [
            {
                name: "Maize meal",
                measure: "2 cups"
            },
            {
                name: "Tomatoes",
                measure: "2"
            },
            {
                name: "Onions",
                measure: "1"
            },
            {
                name: "Carrots",
                measure: "2"
            },
            {
                name: "Beans",
                measure: "1 cup"
            },
            {
                name: "Cooking oil",
                measure: "2 tablespoons"
            }
        ],

        instructions: [
            "Prepare the pap according to the maize meal packaging instructions.",
            "Chop the onions, tomatoes and carrots.",
            "Heat the cooking oil in a pan and cook the onions.",
            "Add the tomatoes, carrots and beans.",
            "Season and cook until the vegetables are tender.",
            "Serve the chakalaka with the prepared pap."
        ],

        dietaryTags: [
            "Vegetarian",
            "Vegan"
        ],

        allergens: [],

        halalCertified: false,

        estimatedCost: null,

        demo: true
    },

    {
        id: "demo-002",

        name: "Vegetable and Bean Curry",

        category: "Lunch",

        description:
            "A comforting vegetable curry made with beans and everyday pantry ingredients.",

        image: "https://images.mrcook.app/recipe-image/01948ca5-234a-7c7f-9b72-61317a843f03?cacheKey=V2VkLCAyMiBKYW4gMjAyNSAwNjoxMzo0MyBHTVQ%3D",

        prepTime: 15,
        cookTime: 30,
        totalTime: 45,

        servings: 4,

        ingredients: [
            {
                name: "Potatoes",
                measure: "3 medium"
            },
            {
                name: "Beans",
                measure: "1 cup"
            },
            {
                name: "Tomatoes",
                measure: "2"
            },
            {
                name: "Onions",
                measure: "1"
            },
            {
                name: "Curry powder",
                measure: "2 teaspoons"
            },
            {
                name: "Cooking oil",
                measure: "2 tablespoons"
            }
        ],

        instructions: [
            "Chop the onions, tomatoes and potatoes.",
            "Heat the cooking oil in a saucepan.",
            "Cook the onions until soft.",
            "Add the curry powder and tomatoes.",
            "Add the potatoes, beans and a little water.",
            "Simmer until the potatoes are tender.",
            "Serve while warm."
        ],

        dietaryTags: [
            "Vegetarian",
            "Vegan"
        ],

        allergens: [],

        halalCertified: false,

        estimatedCost: null,

        demo: true
    },

    {
        id: "demo-003",

        name: "Chicken and Vegetable Stew",

        category: "Dinner",

        description:
            "A hearty chicken stew with potatoes, carrots and tomatoes.",

        image: "https://cdn.southerndishes.com/images/effffbcb-718b-4e07-b30e-bbf1414f0883_U1_fc5b34e5.webp",

        prepTime: 15,
        cookTime: 40,
        totalTime: 55,

        servings: 4,

        ingredients: [
            {
                name: "Chicken",
                measure: "500 g"
            },
            {
                name: "Potatoes",
                measure: "3 medium"
            },
            {
                name: "Carrots",
                measure: "2"
            },
            {
                name: "Tomatoes",
                measure: "2"
            },
            {
                name: "Onions",
                measure: "1"
            },
            {
                name: "Cooking oil",
                measure: "2 tablespoons"
            }
        ],

        instructions: [
            "Cut the chicken and vegetables into suitable pieces.",
            "Heat oil in a saucepan and cook the onions.",
            "Add the chicken and brown lightly.",
            "Add the tomatoes, potatoes and carrots.",
            "Add water and season to taste.",
            "Simmer until the chicken is thoroughly cooked and the vegetables are tender.",
            "Serve hot."
        ],

        dietaryTags: [],

        allergens: [],

        halalCertified: false,

        estimatedCost: null,

        demo: true
    }

];


// ============================================================
// 3. CHECK REQUIRED ELEMENTS
// ============================================================

if (
    !recipeGrid ||
    !recipeCardTemplate ||
    !window.MealMateStorage ||
    !window.MealMateAPI
) {

    console.error(
        "Recipe page could not initialize. " +
        "Check that storage.js and api.js are loaded before recipes.js."
    );

} else {

    initializeRecipesPage();

}


// ============================================================
// 4. INITIALIZE THE RECIPES PAGE
// ============================================================

function initializeRecipesPage() {

    recipeSearchForm.addEventListener("submit", function (event) {
        event.preventDefault();

        loadRecipes(getCurrentFilters());
    });

    mealCategoryFilter.addEventListener("change", renderRecipes);

    dietFilter.addEventListener("change", renderRecipes);

    cookingTimeFilter.addEventListener("change", renderRecipes);

    sortRecipesSelect.addEventListener("change", renderRecipes);

    recipeSearchInput.addEventListener("input", renderRecipes);

    clearRecipeFiltersButton.addEventListener(
        "click",
        clearRecipeFilters
    );

    emptyStateClearFiltersButton.addEventListener(
        "click",
        clearRecipeFilters
    );

    closeRecipeDialogButton.addEventListener(
        "click",
        closeRecipeDialog
    );

    dialogFavouriteButton.addEventListener(
        "click",
        toggleCurrentFavourite
    );

    addRecipeToPlanButton.addEventListener(
        "click",
        addCurrentRecipeToMealPlan
    );

    // Allow the user to close the dialog by clicking outside it.
    recipeDialog.addEventListener("click", function (event) {

        if (event.target === recipeDialog) {
            closeRecipeDialog();
        }

    });

    loadRecipes();

    console.log("MealMate SA recipes page initialized.");

}


// ============================================================
// 5. GET CURRENT FILTER VALUES
// ============================================================

function getCurrentFilters() {

    return {

        search: recipeSearchInput.value.trim(),

        category: mealCategoryFilter.value,

        diet: dietFilter.value,

        maxTime: cookingTimeFilter.value,

        sort: sortRecipesSelect.value

    };

}


// ============================================================
// 6. EXTRACT RECIPES FROM API RESPONSE
// ============================================================

function extractRecipes(response) {

    if (Array.isArray(response)) {
        return response;
    }

    if (!response || typeof response !== "object") {
        return [];
    }

    if (Array.isArray(response.recipes)) {
        return response.recipes;
    }

    if (Array.isArray(response.meals)) {
        return response.meals;
    }

    if (Array.isArray(response.results)) {
        return response.results;
    }

    if (Array.isArray(response.data)) {
        return response.data;
    }

    return [];

}


// ============================================================
// 7. NORMALISE INGREDIENTS
// ============================================================

function normaliseIngredients(recipe) {

    if (Array.isArray(recipe.ingredients)) {

        return recipe.ingredients
            .map(function (ingredient) {

                if (typeof ingredient === "string") {
                    return {
                        name: ingredient.trim(),
                        measure: ""
                    };
                }

                return {

                    name: String(
                        ingredient.name ||
                        ingredient.ingredient ||
                        ""
                    ).trim(),

                    measure: String(
                        ingredient.measure ||
                        ingredient.quantity ||
                        ""
                    ).trim()

                };

            })
            .filter(function (ingredient) {
                return ingredient.name.length > 0;
            });

    }


    // Support TheMealDB recipe format.
    const ingredients = [];

    for (let index = 1; index <= 20; index++) {

        const ingredient = recipe[`strIngredient${index}`];

        const measure = recipe[`strMeasure${index}`];

        if (
            ingredient &&
            String(ingredient).trim()
        ) {

            ingredients.push({

                name: String(ingredient).trim(),

                measure: String(measure || "").trim()

            });

        }

    }

    return ingredients;

}


// ============================================================
// 8. NORMALISE DIETARY TAGS
// ============================================================

function normaliseDietaryTags(recipe) {

    let tags =
        recipe.dietaryTags ||
        recipe.diets ||
        recipe.tags ||
        recipe.strTags ||
        [];

    if (typeof tags === "string") {

        tags = tags
            .split(",")
            .map(function (tag) {
                return tag.trim();
            });

    }

    if (!Array.isArray(tags)) {
        tags = [];
    }

    return tags.map(function (tag) {
        return String(tag).toLowerCase().trim();
    });

}


// ============================================================
// 9. NORMALISE RECIPE DATA
// ============================================================

function parseMinutes(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const parsed = Number.parseFloat(
        String(value).replace(",", ".")
    );

    return Number.isFinite(parsed) && parsed >= 0
        ? parsed
        : null;

}


function normaliseRecipe(recipe) {

    if (!recipe || typeof recipe !== "object") {
        return null;
    }

    const prepTime = parseMinutes(
        recipe.prepTime ||
        recipe.preparationTime ||
        recipe.strPrepTime
    );

    const cookTime = parseMinutes(
        recipe.cookTime ||
        recipe.cookingTime ||
        recipe.strCookTime
    );

    const suppliedTotalTime = parseMinutes(recipe.totalTime);

    const totalTime = suppliedTotalTime !== null
        ? suppliedTotalTime
        : (
            prepTime !== null && cookTime !== null
                ? prepTime + cookTime
                : null
        );

    const estimatedCostValue =
        recipe.estimatedCost ??
        recipe.estimatedPrice ??
        recipe.cost ??
        null;

    const estimatedCost =
        estimatedCostValue === null ||
        estimatedCostValue === ""
            ? null
            : Number(estimatedCostValue);

    const rawInstructions =
        recipe.instructions ||
        recipe.strInstructions ||
        [];

    let instructions = [];

    if (Array.isArray(rawInstructions)) {

        instructions = rawInstructions
            .map(function (step) {
                return String(step).trim();
            })
            .filter(Boolean);

    } else if (typeof rawInstructions === "string") {

        instructions = rawInstructions
            .split(/\r?\n/)
            .map(function (step) {
                return step.trim();
            })
            .filter(Boolean);

    }


    const rawAllergens = recipe.allergens || [];

    const allergens = Array.isArray(rawAllergens)
        ? rawAllergens.map(function (allergen) {
            return String(allergen).toLowerCase().trim();
        })
        : [];


    const id =
        recipe.id ||
        recipe.idMeal ||
        recipe.recipeId ||
        "";

    const name =
        recipe.name ||
        recipe.strMeal ||
        recipe.title ||
        "Untitled Recipe";

    const image =
        recipe.image ||
        recipe.imageUrl ||
        recipe.strMealThumb ||
        PLACEHOLDER_IMAGE;

    const servings = parseMinutes(
        recipe.servings ||
        recipe.yield ||
        recipe.numberOfServings
    );


    return {

        id: String(id),

        name: String(name),

        image: String(image),

        category: String(
            recipe.category ||
            recipe.strCategory ||
            recipe.type ||
            "Other"
        ),

        description: String(
            recipe.description ||
            recipe.strArea ||
            recipe.strCategory ||
            "Explore this recipe and its ingredients."
        ),

        prepTime: prepTime,

        cookTime: cookTime,

        totalTime: totalTime,

        servings: servings,

        ingredients: normaliseIngredients(recipe),

        instructions: instructions,

        dietaryTags: normaliseDietaryTags(recipe),

        allergens: allergens,

        halalCertified:
            recipe.halalCertified === true ||
            recipe.halalStatus === "certified",

        estimatedCost:
            Number.isFinite(estimatedCost) &&
            estimatedCost >= 0
                ? estimatedCost
                : null,

        priceType: recipe.priceType || "estimate",

        source: recipe.source || recipe.provider || "Recipe provider",

        demo: recipe.demo === true

    };

}


// ============================================================
// 10. LOAD RECIPES FROM THE BACKEND
// ============================================================

async function loadRecipes(filters = {}) {

    showLoading(true);

    clearRecipeError();

    try {

        const response = await window.MealMateAPI.searchRecipes(
            filters
        );

        const receivedRecipes = extractRecipes(response);

        recipes = receivedRecipes
            .map(normaliseRecipe)
            .filter(function (recipe) {
                return recipe && recipe.id && recipe.name;
            });

        usingDemoRecipes = false;

        updateRecipeAttribution();

        renderRecipes();

        console.log(
            `Loaded ${recipes.length} recipes from the backend.`
        );

    } catch (error) {

        console.error("Recipe API error:", error);

        // Sample data is used only as a development fallback.
        recipes = DEMO_RECIPES
            .map(normaliseRecipe)
            .filter(Boolean);

        usingDemoRecipes = true;

        updateRecipeAttribution();

        showRecipeError(
            "The recipe backend is not available yet. " +
            "We are showing sample recipes for development. " +
            "These are demonstration entries, not live API results."
        );

        renderRecipes();

    } finally {

        showLoading(false);

    }

}


// ============================================================
// 11. LOADING INDICATOR
// ============================================================

function showLoading(isLoading) {

    if (!recipeLoading) {
        return;
    }

    recipeLoading.classList.toggle("hidden", !isLoading);

}


// ============================================================
// 12. DISPLAY AND CLEAR API ERRORS
// ============================================================

function showRecipeError(message) {

    if (!recipeError) {
        return;
    }

    recipeError.textContent = message;

    recipeError.classList.remove("hidden");

}


function clearRecipeError() {

    if (!recipeError) {
        return;
    }

    recipeError.textContent = "";

    recipeError.classList.add("hidden");

}


// ============================================================
// 13. UPDATE RECIPE ATTRIBUTION
// ============================================================

function updateRecipeAttribution() {

    if (!recipeApiAttribution) {
        return;
    }

    if (usingDemoRecipes) {

        recipeApiAttribution.textContent =
            "Sample recipes are being used for development. " +
            "Live recipe-provider attribution will be displayed " +
            "when the backend is connected.";

    } else {

        recipeApiAttribution.textContent =
            "Recipe information and images are provided by the " +
            "connected recipe service. See the application README " +
            "for API attribution and provider details.";

    }

}


// ============================================================
// 14. CHECK HOUSEHOLD DIETARY PREFERENCES
// ============================================================

function getHouseholdDiet() {

    const preferences = window.MealMateStorage.getPreferences();

    return preferences
        ? preferences.diet || "No restrictions"
        : "No restrictions";

}


function recipeMatchesDiet(recipe, diet) {

    if (
        !diet ||
        diet === "all" ||
        diet === "No restrictions"
    ) {
        return true;
    }

    if (diet === "Vegan") {

        return recipe.dietaryTags.includes("vegan");

    }

    if (diet === "Vegetarian") {

        return (
            recipe.dietaryTags.includes("vegetarian") ||
            recipe.dietaryTags.includes("vegan")
        );

    }

    if (diet === "Halaal") {

        // Do not assume that a vegetarian meal is Halaal-certified.
        return recipe.halalCertified === true;

    }

    return false;

}


// ============================================================
// 15. CHECK ALLERGY INFORMATION
// ============================================================

const ALLERGEN_TERMS = {

    "Peanuts": [
        "peanut",
        "groundnut"
    ],

    "Tree nuts": [
        "almond",
        "cashew",
        "walnut",
        "pecan",
        "pistachio",
        "hazelnut",
        "macadamia",
        "brazil nut"
    ],

    "Dairy": [
        "milk",
        "cheese",
        "cream",
        "butter",
        "yoghurt",
        "yogurt",
        "whey",
        "casein"
    ],

    "Eggs": [
        "egg"
    ],

    "Gluten/Wheat": [
        "wheat",
        "flour",
        "gluten",
        "barley",
        "rye",
        "couscous",
        "breadcrumbs",
        "pasta"
    ],

    "Soy": [
        "soy",
        "soya",
        "tofu",
        "edamame"
    ],

    "Fish": [
        "fish",
        "salmon",
        "tuna",
        "sardine",
        "anchovy",
        "cod"
    ],

    "Shellfish": [
        "shellfish",
        "prawn",
        "shrimp",
        "crab",
        "lobster",
        "mussel",
        "oyster",
        "squid"
    ],

    "Sesame": [
        "sesame",
        "tahini"
    ]

};


// Checks whether a word appears as a complete term.
// This prevents matching "egg" inside "eggplant".
function containsIngredientTerm(text, term) {

    const escapedTerm = term.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

    const expression = new RegExp(
        `\\b${escapedTerm}\\b`,
        "i"
    );

    return expression.test(text);

}


function recipeContainsAllergen(recipe, selectedAllergies) {

    const ingredientText = recipe.ingredients
        .map(function (ingredient) {
            return ingredient.name;
        })
        .join(" ");

    const combinedText = (
        ingredientText +
        " " +
        recipe.allergens.join(" ")
    ).toLowerCase();


    for (const allergy of selectedAllergies) {

        const terms = ALLERGEN_TERMS[allergy] || [allergy];

        for (const term of terms) {

            if (containsIngredientTerm(combinedText, term)) {
                return true;
            }

        }

    }

    return false;

}


function recipeMatchesHouseholdAllergies(recipe) {

    const preferences = window.MealMateStorage.getPreferences();

    if (!preferences || !Array.isArray(preferences.allergies)) {
        return true;
    }

    return !recipeContainsAllergen(
        recipe,
        preferences.allergies
    );

}


// ============================================================
// 16. CHECK WHETHER A RECIPE MATCHES HOUSEHOLD PREFERENCES
// ============================================================

function recipeMatchesHouseholdPreferences(recipe) {

    const householdDiet = getHouseholdDiet();

    // Apply the household's dietary restriction first.
    if (!recipeMatchesDiet(recipe, householdDiet)) {
        return false;
    }

    // Apply the household's allergy exclusions.
    if (!recipeMatchesHouseholdAllergies(recipe)) {
        return false;
    }

    return true;

}


// ============================================================
// 17. FILTER RECIPES
// ============================================================

function getFilteredRecipes() {

    const filters = getCurrentFilters();

    const searchTerm = filters.search.toLowerCase();

    return recipes.filter(function (recipe) {

        // Always apply household dietary restrictions.
        if (!recipeMatchesHouseholdPreferences(recipe)) {
            return false;
        }


        // Apply any additional dietary filter.
        if (
            filters.diet !== "all" &&
            !recipeMatchesDiet(recipe, filters.diet)
        ) {
            return false;
        }


        // Filter by category.
        if (
            filters.category !== "all" &&
            recipe.category.toLowerCase() !==
            filters.category.toLowerCase()
        ) {
            return false;
        }


        // Filter by cooking time.
        if (filters.maxTime !== "all") {

            const maximumTime = Number(filters.maxTime);

            // Unknown cooking times are excluded from a time-limited search.
            if (
                recipe.totalTime === null ||
                recipe.totalTime > maximumTime
            ) {
                return false;
            }

        }


        // Search recipe names, descriptions and ingredients.
        const searchableText = [

            recipe.name,

            recipe.description,

            recipe.category,

            ...recipe.ingredients.map(function (ingredient) {
                return ingredient.name;
            })

        ].join(" ").toLowerCase();


        if (!searchableText.includes(searchTerm)) {
            return false;
        }


        return true;

    });

}


// ============================================================
// 18. SORT RECIPES
// ============================================================

function sortRecipeResults(recipeList) {

    const sortType = sortRecipesSelect.value;

    const sortedRecipes = [...recipeList];

    if (sortType === "name-asc") {

        sortedRecipes.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });

    } else if (sortType === "time-asc") {

        sortedRecipes.sort(function (a, b) {

            if (a.totalTime === null) return 1;

            if (b.totalTime === null) return -1;

            return a.totalTime - b.totalTime;

        });

    } else if (sortType === "cost-asc") {

        sortedRecipes.sort(function (a, b) {

            if (a.estimatedCost === null) return 1;

            if (b.estimatedCost === null) return -1;

            return a.estimatedCost - b.estimatedCost;

        });

    } else if (sortType === "cost-desc") {

        sortedRecipes.sort(function (a, b) {

            if (a.estimatedCost === null) return 1;

            if (b.estimatedCost === null) return -1;

            return b.estimatedCost - a.estimatedCost;

        });

    }

    return sortedRecipes;

}


// ============================================================
// 19. FORMAT RECIPE TIME
// ============================================================

function formatRecipeTime(recipe) {

    if (recipe.totalTime === null) {
        return "Time not listed";
    }

    return `${recipe.totalTime} minutes`;

}


// ============================================================
// 20. FORMAT RECIPE COST
// ============================================================

function formatRecipeCost(recipe) {

    if (recipe.estimatedCost === null) {
        return "Price unavailable";
    }

    const formattedCost = window.MealMateApp.formatCurrency(
        recipe.estimatedCost
    );

    if (recipe.priceType === "retailer") {
        return `Retailer price: ${formattedCost}`;
    }

    return `Est. ${formattedCost}`;

}


// ============================================================
// 21. VALIDATE RECIPE IMAGE SOURCE
// ============================================================

function getSafeImageSource(imageSource) {

    if (
        typeof imageSource !== "string" ||
        !imageSource.trim()
    ) {
        return PLACEHOLDER_IMAGE;
    }

    const source = imageSource.trim();

    if (
        source.startsWith("/") ||
        source.startsWith("./") ||
        source.startsWith("../")
    ) {
        return source;
    }

    try {

        const parsedURL = new URL(source);

        if (
            parsedURL.protocol === "http:" ||
            parsedURL.protocol === "https:"
        ) {
            return source;
        }

    } catch (error) {
        return PLACEHOLDER_IMAGE;
    }

    return PLACEHOLDER_IMAGE;

}


// ============================================================
// 22. RENDER A SINGLE RECIPE CARD
// ============================================================

function createRecipeCard(recipe) {

    const card = recipeCardTemplate.content
        .firstElementChild
        .cloneNode(true);


    const image = card.querySelector(".recipe-image");

    const category = card.querySelector(".recipe-category");

    const favouriteButton = card.querySelector(".favourite-button");

    const time = card.querySelector(".recipe-time");

    const cost = card.querySelector(".recipe-cost");

    const title = card.querySelector(".recipe-title");

    const description = card.querySelector(".recipe-description");

    const tags = card.querySelector(".recipe-tags");

    const detailsButton = card.querySelector(
        ".recipe-details-button"
    );


    image.src = getSafeImageSource(recipe.image);

    image.alt = `Meal prepared for ${recipe.name}`;

    image.onerror = function () {
        image.onerror = null;
        image.src = PLACEHOLDER_IMAGE;
    };


    category.textContent = recipe.category;

    time.textContent = formatRecipeTime(recipe);

    cost.textContent = formatRecipeCost(recipe);

    title.textContent = recipe.name;

    description.textContent = recipe.description;


    // Display dietary tags.
    tags.replaceChildren();

    recipe.dietaryTags.forEach(function (tag) {

        const tagElement = document.createElement("span");

        tagElement.className = "recipe-tag";

        tagElement.textContent = tag;

        tags.appendChild(tagElement);

    });


    // Update favourite button.
    const isSaved = window.MealMateStorage.isFavourite(recipe.id);

    favouriteButton.setAttribute(
        "aria-pressed",
        String(isSaved)
    );

    favouriteButton.textContent = isSaved ? "♥" : "♡";

    favouriteButton.setAttribute(
        "aria-label",
        isSaved
            ? `Remove ${recipe.name} from favourites`
            : `Add ${recipe.name} to favourites`
    );


    // Connect favourite button.
    favouriteButton.addEventListener("click", function () {
        toggleFavourite(recipe);
    });


    // Connect recipe details button.
    detailsButton.addEventListener("click", function () {
        openRecipeDetails(recipe);
    });


    return card;

}


// ============================================================
// 23. RENDER ALL RECIPE CARDS
// ============================================================

function renderRecipes() {

    if (!recipeGrid) {
        return;
    }

    clearRecipeError();

    const filteredRecipes = sortRecipeResults(
        getFilteredRecipes()
    );


    recipeGrid.replaceChildren();


    filteredRecipes.forEach(function (recipe) {

        const card = createRecipeCard(recipe);

        recipeGrid.appendChild(card);

    });


    recipeResultCount.textContent =
        `${filteredRecipes.length} recipe(s) found.`;


    const noResults = filteredRecipes.length === 0;

    recipeEmptyState.classList.toggle(
        "hidden",
        !noResults
    );

    renderFavouriteRecipes();

}


// ============================================================
// 24. TOGGLE FAVOURITE RECIPE
// ============================================================

function toggleFavourite(recipe) {

    const alreadySaved = window.MealMateStorage.isFavourite(
        recipe.id
    );

    let saved;

    if (alreadySaved) {

        saved = window.MealMateStorage.removeFavourite(
            recipe.id
        );

    } else {

        saved = window.MealMateStorage.addFavourite(recipe);

    }

    if (!saved) {

        console.error("Could not update favourite recipe.");

        return;

    }


    const isNowSaved = window.MealMateStorage.isFavourite(recipe.id);

    window.MealMateStorage.addActivity(

        isNowSaved
            ? `Saved ${recipe.name} to favourites`
            : `Removed ${recipe.name} from favourites`,

        "favourite"

    );


    renderRecipes();


    if (currentRecipe && currentRecipe.id === recipe.id) {
        updateDialogFavouriteButton();
    }

}


// ============================================================
// 25. RENDER FAVOURITE RECIPES
// ============================================================

function renderFavouriteRecipes() {

    if (!favouriteRecipeGrid) {
        return;
    }

    const savedRecipes = window.MealMateStorage.getFavourites();

    favouriteRecipeGrid.replaceChildren();


    const normalisedFavourites = savedRecipes
        .map(normaliseRecipe)
        .filter(function (recipe) {
            return recipe && recipe.id;
        });


    normalisedFavourites.forEach(function (recipe) {

        const card = createRecipeCard(recipe);

        favouriteRecipeGrid.appendChild(card);

    });


    const noFavourites = normalisedFavourites.length === 0;

    emptyFavourites.classList.toggle(
        "hidden",
        !noFavourites
    );

}


// ============================================================
// 26. LOAD ADDITIONAL RECIPE DETAILS
// ============================================================

async function loadFullRecipeDetails(recipe) {

    const hasIngredients = recipe.ingredients.length > 0;

    const hasInstructions = recipe.instructions.length > 0;

    if (
        hasIngredients &&
        hasInstructions
    ) {
        return recipe;
    }


    try {

        const response = await window.MealMateAPI.getRecipeById(
            recipe.id
        );


        const fullRecipe = response.recipe || response.data || response;

        const normalisedDetails = normaliseRecipe(fullRecipe);


        if (normalisedDetails) {

            // Preserve fields from the original recipe if
            // the detail endpoint does not provide them.
            return {
                ...recipe,
                ...normalisedDetails,

                ingredients: normalisedDetails.ingredients.length > 0
                    ? normalisedDetails.ingredients
                    : recipe.ingredients,

                instructions: normalisedDetails.instructions.length > 0
                    ? normalisedDetails.instructions
                    : recipe.instructions

            };

        }

    } catch (error) {

        console.error("Could not load full recipe details:", error);

    }

    return recipe;

}


// ============================================================
// 27. OPEN RECIPE DETAILS DIALOG
// ============================================================

async function openRecipeDetails(recipe) {

    currentRecipe = recipe;

    dialogRecipeTitle.textContent = recipe.name;

    dialogRecipeDescription.textContent =
        "Loading recipe information...";


    dialogIngredients.replaceChildren();

    dialogInstructions.replaceChildren();


    dialogPrepTime.textContent = "--";

    dialogCookTime.textContent = "--";

    dialogRecipeCost.textContent = "--";

    dialogRecipeServings.textContent = "--";


    updateDialogFavouriteButton();

    addRecipeToPlanButton.disabled = true;


    if (!recipeDialog.open) {
        recipeDialog.showModal();
    }


    const fullRecipe = await loadFullRecipeDetails(recipe);

    currentRecipe = fullRecipe;


    // Update image.
    dialogRecipeImage.src = getSafeImageSource(fullRecipe.image);

    dialogRecipeImage.alt = `Prepared ${fullRecipe.name}`;

    dialogRecipeImage.onerror = function () {
        dialogRecipeImage.onerror = null;
        dialogRecipeImage.src = PLACEHOLDER_IMAGE;
    };


    dialogRecipeTitle.textContent = fullRecipe.name;

    dialogRecipeDescription.textContent =
        fullRecipe.description;


    dialogPrepTime.textContent =
        fullRecipe.prepTime === null
            ? "Not listed"
            : `${fullRecipe.prepTime} minutes`;


    dialogCookTime.textContent =
        fullRecipe.cookTime === null
            ? "Not listed"
            : `${fullRecipe.cookTime} minutes`;


    dialogRecipeCost.textContent =
        formatRecipeCost(fullRecipe);


    dialogRecipeServings.textContent =
        fullRecipe.servings === null
            ? "Not listed"
            : fullRecipe.servings;


    displayDialogIngredients(fullRecipe);

    displayDialogInstructions(fullRecipe);


    addRecipeToPlanButton.disabled = false;

    updateDialogFavouriteButton();

}


// ============================================================
// 28. DISPLAY RECIPE INGREDIENTS
// ============================================================

function displayDialogIngredients(recipe) {

    dialogIngredients.replaceChildren();

    if (recipe.ingredients.length === 0) {

        const item = document.createElement("li");

        item.textContent = "Ingredient information is unavailable.";

        dialogIngredients.appendChild(item);

        return;

    }


    recipe.ingredients.forEach(function (ingredient) {

        const item = document.createElement("li");

        const measure = ingredient.measure
            ? `${ingredient.measure} `
            : "";

        item.textContent = `${measure}${ingredient.name}`;

        dialogIngredients.appendChild(item);

    });

}


// ============================================================
// 29. DISPLAY RECIPE INSTRUCTIONS
// ============================================================

function displayDialogInstructions(recipe) {

    dialogInstructions.replaceChildren();

    if (recipe.instructions.length === 0) {

        const item = document.createElement("li");

        item.textContent = "Cooking instructions are unavailable.";

        dialogInstructions.appendChild(item);

        return;

    }


    recipe.instructions.forEach(function (instruction) {

        const item = document.createElement("li");

        item.textContent = instruction;

        dialogInstructions.appendChild(item);

    });

}


// ============================================================
// 30. UPDATE DIALOG FAVOURITE BUTTON
// ============================================================

function updateDialogFavouriteButton() {

    if (!currentRecipe) {
        return;
    }

    const saved = window.MealMateStorage.isFavourite(
        currentRecipe.id
    );

    dialogFavouriteButton.textContent = saved
        ? "♥ Remove from Favourites"
        : "♡ Add to Favourites";

    dialogFavouriteButton.setAttribute(
        "aria-pressed",
        String(saved)
    );

}


function toggleCurrentFavourite() {

    if (!currentRecipe) {
        return;
    }

    toggleFavourite(currentRecipe);

}


// ============================================================
// 31. CLOSE RECIPE DETAILS DIALOG
// ============================================================

function closeRecipeDialog() {

    if (recipeDialog.open) {
        recipeDialog.close();
    }

}


// ============================================================
// 32. ADD RECIPE TO WEEKLY MEAL PLAN
// ============================================================

function addCurrentRecipeToMealPlan() {

    if (!currentRecipe) {
        return;
    }


    const existingPlan = window.MealMateStorage.getMealPlan();


    const plan = (
        existingPlan &&
        !Array.isArray(existingPlan) &&
        typeof existingPlan === "object"
    )
        ? existingPlan
        : {};


    const selectedRecipes = Array.isArray(plan.selectedRecipes)
        ? [...plan.selectedRecipes]
        : [];


    const alreadyAdded = selectedRecipes.some(function (item) {

        return String(item.recipeId) === String(currentRecipe.id);

    });


    if (alreadyAdded) {

        addRecipeToPlanButton.textContent = "Already in Meal Plan";

        return;

    }


    const newMeal = {

        id: window.MealMateApp.generateId(),

        recipeId: currentRecipe.id,

        name: currentRecipe.name,

        category: currentRecipe.category,

        servings: currentRecipe.servings,

        addedAt: new Date().toISOString()

    };


    selectedRecipes.push(newMeal);


    const updatedPlan = {

        ...plan,

        selectedRecipes: selectedRecipes,

        updatedAt: new Date().toISOString()

    };


    const saved = window.MealMateStorage.saveMealPlan(updatedPlan);


    if (!saved) {

        console.error("Could not save the meal plan.");

        return;

    }


    window.MealMateStorage.addActivity(
        `${currentRecipe.name} added to the meal plan`,
        "meal-plan"
    );


    addRecipeToPlanButton.textContent = "Added to Meal Plan";

    console.log("Recipe added to meal plan:", currentRecipe.name);

}


// ============================================================
// 33. CLEAR ALL RECIPE FILTERS
// ============================================================

function clearRecipeFilters() {

    recipeSearchForm.reset();

    mealCategoryFilter.value = "all";

    dietFilter.value = "all";

    cookingTimeFilter.value = "all";

    sortRecipesSelect.value = "default";

    clearRecipeError();

    renderRecipes();

}


// ============================================================
// 34. INITIALISE THE PAGE
// ============================================================

// Load recipes and favourites as soon as the page is ready.

renderFavouriteRecipes();

// ============================================================
// END OF RECIPES.JS
// ============================================================
