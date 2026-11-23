
// ============================================================
// MEALMATE SA
// Recipe Service Tests
// File: tests/recipeService.test.js
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";

import {
    RecipeServiceError,
    searchMeals,
    getMealById,
    getRandomRecipes,
    extractIngredients,
    normaliseRecipe
} from "../src/services/recipeService.js";


// ============================================================
// 1. TEST HELPERS
// ============================================================

// Create a sample TheMealDB recipe.
function createMeal(overrides = {}) {

    return {
        idMeal: "52772",
        strMeal: "Chicken Rice",
        strMealThumb: "https://example.com/chicken.jpg",
        strCategory: "Chicken",
        strArea: "South African",
        strTags: "Healthy, Family-friendly",
        strInstructions: "Cook the chicken and rice.",
        strSource: "https://example.com/recipe",
        strYoutube: "https://youtube.com/example",

        strIngredient1: "Chicken",
        strMeasure1: "500g",

        strIngredient2: "Rice",
        strMeasure2: "2 cups",

        strIngredient3: "",
        strMeasure3: "",

        ...overrides
    };

}


// Simulate an HTTP response.
function createResponse(data, status = 200) {

    return {
        ok: status >= 200 && status < 300,
        status: status,
        json: async function () {
            return data;
        }
    };

}


// Replace fetch temporarily during an individual test.
async function withFetchMock(mockImplementation, callback) {

    const originalFetch = globalThis.fetch;

    globalThis.fetch = mockImplementation;

    try {

        return await callback();

    } finally {

        globalThis.fetch = originalFetch;

    }

}


// ============================================================
// 2. INGREDIENT EXTRACTION TESTS
// ============================================================

test("extracts ingredients and measurements from TheMealDB fields", function () {

    const meal = createMeal();

    const result = extractIngredients(meal);

    assert.deepEqual(result, [
        {
            name: "Chicken",
            measure: "500g"
        },
        {
            name: "Rice",
            measure: "2 cups"
        }
    ]);

});


test("ignores empty ingredient fields", function () {

    const meal = {
        strIngredient1: "   ",
        strMeasure1: "1 cup",
        strIngredient2: "Salt",
        strMeasure2: "To taste"
    };

    const result = extractIngredients(meal);

    assert.deepEqual(result, [
        {
            name: "Salt",
            measure: "To taste"
        }
    ]);

});


// ============================================================
// 3. RECIPE NORMALISATION TESTS
// ============================================================

test("normalises TheMealDB data into the MealMate recipe format", function () {

    const result = normaliseRecipe(createMeal());

    assert.equal(result.id, "52772");

    assert.equal(result.name, "Chicken Rice");

    assert.equal(result.category, "Chicken");

    assert.equal(result.image, "https://example.com/chicken.jpg");

    assert.equal(result.source, "TheMealDB");

    assert.equal(result.sourceUrl, "https://example.com/recipe");

    assert.equal(result.ingredients.length, 2);

    assert.equal(result.instructions, "Cook the chicken and rice.");

});


test("returns null for an invalid recipe", function () {

    assert.equal(normaliseRecipe(null), null);

    assert.equal(normaliseRecipe("Chicken"), null);

    assert.equal(normaliseRecipe({}), null);

});


test("does not invent recipe prices, serving sizes or cooking times", function () {

    const result = normaliseRecipe(createMeal());

    assert.equal(result.estimatedCost, null);

    assert.equal(result.priceType, "unavailable");

    assert.equal(result.servings, null);

    assert.equal(result.prepTime, null);

    assert.equal(result.cookTime, null);

    assert.equal(result.halalCertified, false);

});


test("adds vegan and vegetarian tags to vegan recipes", function () {

    const result = normaliseRecipe(
        createMeal({
            strCategory: "Vegan",
            strTags: ""
        })
    );

    assert.ok(result.dietaryTags.includes("vegan"));

    assert.ok(result.dietaryTags.includes("vegetarian"));

});


test("adds vegetarian tags to vegetarian recipes", function () {

    const result = normaliseRecipe(
        createMeal({
            strCategory: "Vegetarian",
            strTags: ""
        })
    );

    assert.ok(
        result.dietaryTags.includes("vegetarian")
    );

});


test("removes duplicate dietary tags", function () {

    const result = normaliseRecipe(
        createMeal({
            strCategory: "Vegan",
            strTags: "Vegan, Vegetarian"
        })
    );

    assert.equal(
        result.dietaryTags.filter(tag => tag === "vegan").length,
        1
    );

    assert.equal(
        result.dietaryTags.filter(tag => tag === "vegetarian").length,
        1
    );

});


// ============================================================
// 4. RECIPE SEARCH TESTS
// ============================================================

test("searches recipes by name", async function () {

    await withFetchMock(
        async function (url) {

            const requestUrl = new URL(url);

            assert.ok(
                requestUrl.pathname.endsWith("/search.php")
            );

            assert.equal(
                requestUrl.searchParams.get("s"),
                "chicken"
            );

            return createResponse({
                meals: [createMeal()]
            });

        },

        async function () {

            const result = await searchMeals({
                search: " chicken "
            });

            assert.equal(result.length, 1);

            assert.equal(result[0].name, "Chicken Rice");

        }
    );

});


test("removes duplicate recipes returned by name searches", async function () {

    await withFetchMock(
        async function () {

            return createResponse({
                meals: [
                    createMeal(),
                    createMeal({
                        strMeal: "Another Chicken Rice"
                    })
                ]
            });

        },

        async function () {

            const result = await searchMeals({
                search: "chicken"
            });

            assert.equal(result.length, 1);

        }
    );

});


test("searches by ingredient when no recipe names match", async function () {

    let requestCount = 0;

    await withFetchMock(
        async function (url) {

            requestCount++;

            const requestUrl = new URL(url);

            // First request: search by name.
            if (
                requestUrl.pathname.endsWith("/search.php")
            ) {

                return createResponse({
                    meals: null
                });

            }

            // Second request: search by ingredient.
            if (
                requestUrl.pathname.endsWith("/filter.php")
            ) {

                assert.equal(
                    requestUrl.searchParams.get("i"),
                    "chicken"
                );

                return createResponse({
                    meals: [
                        {
                            idMeal: "52772",
                            strMeal: "Chicken Rice"
                        }
                    ]
                });

            }

            // Third request: retrieve complete details.
            assert.ok(
                requestUrl.pathname.endsWith("/lookup.php")
            );

            return createResponse({
                meals: [createMeal()]
            });

        },

        async function () {

            const result = await searchMeals({
                search: "chicken"
            });

            assert.equal(requestCount, 3);

            assert.equal(result.length, 1);

            assert.equal(result[0].id, "52772");

        }
    );

});


test("returns an empty array when searches find no recipes", async function () {

    await withFetchMock(
        async function () {

            return createResponse({
                meals: null
            });

        },

        async function () {

            const result = await searchMeals({
                search: "unknown-recipe"
            });

            assert.deepEqual(result, []);

        }
    );

});


// ============================================================
// 5. CATEGORY SEARCH TESTS
// ============================================================

test("searches recipes by category and retrieves full details", async function () {

    await withFetchMock(
        async function (url) {

            const requestUrl = new URL(url);

            if (
                requestUrl.pathname.endsWith("/filter.php")
            ) {

                assert.equal(
                    requestUrl.searchParams.get("c"),
                    "Chicken"
                );

                return createResponse({
                    meals: [
                        {
                            idMeal: "52772",
                            strMeal: "Chicken Rice"
                        }
                    ]
                });

            }

            assert.ok(
                requestUrl.pathname.endsWith("/lookup.php")
            );

            assert.equal(
                requestUrl.searchParams.get("i"),
                "52772"
            );

            return createResponse({
                meals: [createMeal()]
            });

        },

        async function () {

            const result = await searchMeals({
                category: "Chicken"
            });

            assert.equal(result.length, 1);

            assert.equal(result[0].name, "Chicken Rice");

        }
    );

});


// ============================================================
// 6. RANDOM RECIPE TESTS
// ============================================================

test("retrieves a random recipe when no filters are provided", async function () {

    await withFetchMock(
        async function (url) {

            const requestUrl = new URL(url);

            assert.ok(
                requestUrl.pathname.endsWith("/random.php")
            );

            return createResponse({
                meals: [createMeal()]
            });

        },

        async function () {

            const result = await getRandomRecipes();

            assert.equal(result.length, 1);

            assert.equal(result[0].name, "Chicken Rice");

        }
    );

});


test("throws an error when no random recipe is returned", async function () {

    await withFetchMock(
        async function () {

            return createResponse({
                meals: null
            });

        },

        async function () {

            await assert.rejects(
                getRandomRecipes(),
                function (error) {

                    assert.ok(
                        error instanceof RecipeServiceError
                    );

                    assert.equal(error.status, 502);

                    return true;

                }
            );

        }
    );

});


// ============================================================
// 7. RECIPE DETAILS TESTS
// ============================================================

test("retrieves complete recipe details using a valid ID", async function () {

    await withFetchMock(
        async function (url) {

            const requestUrl = new URL(url);

            assert.ok(
                requestUrl.pathname.endsWith("/lookup.php")
            );

            assert.equal(
                requestUrl.searchParams.get("i"),
                "52772"
            );

            return createResponse({
                meals: [createMeal()]
            });

        },

        async function () {

            const result = await getMealById("52772");

            assert.equal(result.id, "52772");

            assert.equal(result.name, "Chicken Rice");

            assert.equal(result.ingredients.length, 2);

        }
    );

});


test("rejects invalid recipe IDs", async function () {

    await assert.rejects(
        getMealById("abc"),
        function (error) {

            assert.ok(error instanceof RecipeServiceError);

            assert.equal(error.status, 400);

            return true;

        }
    );

});


test("returns a 404 error when a recipe does not exist", async function () {

    await withFetchMock(
        async function () {

            return createResponse({
                meals: null
            });

        },

        async function () {

            await assert.rejects(
                getMealById("999999"),
                function (error) {

                    assert.ok(
                        error instanceof RecipeServiceError
                    );

                    assert.equal(error.status, 404);

                    return true;

                }
            );

        }
    );

});


// ============================================================
// 8. EXTERNAL API ERROR TESTS
// ============================================================

test("handles HTTP errors from TheMealDB", async function () {

    await withFetchMock(
        async function () {

            return createResponse(
                {},
                503
            );

        },

        async function () {

            await assert.rejects(
                searchMeals({
                    search: "chicken"
                }),
                function (error) {

                    assert.ok(
                        error instanceof RecipeServiceError
                    );

                    assert.equal(error.status, 502);

                    assert.match(error.message, /HTTP 503/);

                    return true;

                }
            );

        }
    );

});


test("handles invalid JSON from TheMealDB", async function () {

    await withFetchMock(
        async function () {

            return {
                ok: true,
                status: 200,

                json: async function () {

                    throw new SyntaxError("Invalid JSON");

                }
            };

        },

        async function () {

            await assert.rejects(
                searchMeals({
                    search: "chicken"
                }),
                /invalid JSON/
            );

        }
    );

});


test("rejects unexpected external API responses", async function () {

    await withFetchMock(
        async function () {

            return createResponse({
                unexpected: "response"
            });

        },

        async function () {

            await assert.rejects(
                searchMeals({
                    search: "chicken"
                }),
                /unexpected response/
            );

        }
    );

});


test("handles external API connection failures", async function () {

    const originalConsoleError = console.error;

    console.error = function () {};

    try {

        await withFetchMock(
            async function () {

                throw new Error("Network connection failed");

            },

            async function () {

                await assert.rejects(
                    searchMeals({
                        search: "chicken"
                    }),
                    function (error) {

                        assert.ok(
                            error instanceof RecipeServiceError
                        );

                        assert.equal(error.status, 502);

                        assert.match(
                            error.message,
                            /Unable to connect/
                        );

                        return true;

                    }
                );

            }
        );

    } finally {

        console.error = originalConsoleError;

    }

});


// ============================================================
// END OF RECIPE SERVICE TESTS
// ============================================================
